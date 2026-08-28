import type { Block, PageContent } from "@/components/blocks/types";

// Static stand-in for the "no invisible/low-contrast text" half of
// docs/site-templates-plan.md's "bulletproof" bar. That bar is written as
// a live-browser check, and this is not a substitute for seeing a template
// render — but the two bugs that bar actually caught (a stat counter's
// near-black default `valueColor` on an ink section; text placed on a dark
// `bleed()` without a light color) are both decidable from the block tree
// alone, so they are worth catching in CI rather than by eye.

type Style = Record<string, unknown>;

export type BlockVisit = {
  block: Block;
  /** Nearest ancestor-or-self `background` value, page root included. */
  background: string;
  /** e.g. "home > section[2] > columns[0] > heading[1]" */
  path: string;
};

function baseStyle(block: Block): Style {
  const style = block.style as { base?: Style } | undefined;
  return style?.base ?? {};
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export function walk(content: PageContent, rootLabel: string): BlockVisit[] {
  const out: BlockVisit[] = [];
  const visit = (block: Block, inherited: string, path: string) => {
    const own = str(baseStyle(block).background);
    const background = own ?? inherited;
    out.push({ block, background, path });
    (block.children ?? []).forEach((child, i) => {
      visit(child, background, `${path} > ${child.type}[${i}]`);
    });
  };
  visit(content.root, "#ffffff", `${rootLabel}:${content.root.type}`);
  return out;
}

// --- color ------------------------------------------------------------

/** Returns null for anything not a flat, resolvable color (gradients, `var()`, `$token`, "transparent"). */
export function parseColor(value: string | null | undefined): [number, number, number] | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const [a, b] = [relativeLuminance(fg), relativeLuminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

// --- text-bearing style keys ------------------------------------------

// Which style keys on which block types paint text, and what the registry
// (components/blocks/registry.tsx `defaultStyle`) falls back to when the
// template leaves the key unset — the fallback is the interesting half:
// every one of these defaults is near-black, which is exactly how a stat
// counter goes invisible on a dark section.
const TEXT_COLOR_KEYS: Record<string, { key: string; fallback: string }[]> = {
  text: [{ key: "color", fallback: "#111111" }],
  heading: [{ key: "color", fallback: "#111111" }],
  statCounter: [
    { key: "valueColor", fallback: "#111111" },
    { key: "labelColor", fallback: "#6b7280" },
  ],
  accordion: [
    { key: "titleColor", fallback: "#111111" },
    { key: "contentColor", fallback: "#4b5563" },
  ],
  comparisonTable: [
    { key: "headerColor", fallback: "#111111" },
    { key: "labelColor", fallback: "#374151" },
  ],
  contentSwitcher: [
    { key: "activeColor", fallback: "#111111" },
    { key: "inactiveColor", fallback: "#9ca3af" },
  ],
};

export type ContrastIssue = {
  path: string;
  styleKey: string;
  color: string;
  background: string;
  ratio: number;
  required: number;
};

/**
 * WCAG 1.4.3 thresholds: 3.0 for large text (>=24px, or >=18.66px at
 * weight >=700), 4.5 otherwise. A `displayAs: "badge"` text block paints
 * its own pill background from a fixed tone, so its color is not read
 * against the section behind it — skipped.
 */
export function contrastIssues(visits: BlockVisit[]): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  for (const { block, background, path } of visits) {
    const keys = TEXT_COLOR_KEYS[block.type];
    if (!keys) continue;
    const style = baseStyle(block);
    if (style.displayAs === "badge") continue;
    const bg = parseColor(background);
    if (!bg) continue;

    const size = Number.parseFloat(String(style.fontSize ?? "16"));
    const weight = Number.parseFloat(String(style.fontWeight ?? "400"));
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = large ? 3 : 4.5;

    for (const { key, fallback } of keys) {
      const raw = str(style[key]) ?? fallback;
      const fg = parseColor(raw);
      if (!fg) continue;
      const ratio = contrastRatio(fg, bg);
      if (ratio < required) {
        issues.push({ path, styleKey: key, color: raw, background, ratio: Math.round(ratio * 100) / 100, required });
      }
    }
  }
  return issues;
}

// --- image-bearing props ----------------------------------------------

/** Blocks whose whole point is an image, and the prop that has to carry one. */
export function missingImages(visits: BlockVisit[]): string[] {
  const missing: string[] = [];
  for (const { block, path } of visits) {
    const props = (block.props ?? {}) as Record<string, unknown>;
    if (block.type === "image" || block.type === "imageOverlay") {
      if (!str(props.src)) missing.push(`${path} (props.src)`);
    }
    if (block.type === "gallery" || block.type === "slider") {
      const images = Array.isArray(props.images) ? (props.images as { src?: unknown }[]) : [];
      if (images.length === 0) missing.push(`${path} (props.images is empty)`);
      images.forEach((img, i) => {
        if (!str(img?.src)) missing.push(`${path} (props.images[${i}].src)`);
      });
    }
  }
  return missing;
}
