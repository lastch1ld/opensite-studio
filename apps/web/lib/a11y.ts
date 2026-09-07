import type { Block, PageContent } from "@/components/blocks/types";
import type { ThemeTokens } from "./theme";
import { resolveStyle, resolveTokens } from "./responsiveStyle";

// A WCAG checker over the block tree, not over rendered HTML: the tree is
// the source of truth (architecture.md), it's available server-side
// without a browser, and it lets a finding point at the block a user can
// go and fix rather than at a DOM node they'd have to trace back.
//
// Deliberately a small set of rules that are decidable from the tree and
// have no false-positive-prone heuristics. It is not a replacement for
// axe-core against the real page — an outbound "everything here is a real
// problem" list beats a longer list nobody trusts.

export type A11yIssue = {
  rule: string;
  severity: "error" | "warning";
  message: string;
  blockId: string;
  blockType: string;
  /** e.g. "section > columns[1] > heading[0]" */
  path: string;
};

type Style = Record<string, unknown>;

// --- color ------------------------------------------------------------

export function parseColor(value: unknown): [number, number, number] | null {
  if (typeof value !== "string") return null;
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

// Which style keys paint text on which block types, and the registry
// default each falls back to when unset (components/blocks/registry.tsx).
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

// --- the walk ---------------------------------------------------------

export function auditPageContent(content: PageContent, theme: ThemeTokens | null): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const headingLevels: { level: number; block: Block; path: string }[] = [];

  const visit = (block: Block, inheritedBg: string, path: string) => {
    const style = resolveTokens(resolveStyle(block.style, "base"), theme) as Style;
    const props = (block.props ?? {}) as Record<string, unknown>;
    const own = typeof style.background === "string" && style.background.trim() ? style.background.trim() : null;
    const background = own && own !== "transparent" ? own : inheritedBg;

    const add = (rule: string, severity: A11yIssue["severity"], message: string) =>
      issues.push({ rule, severity, message, blockId: block.id, blockType: block.type, path });

    // Images without alt text.
    if (block.type === "image" || block.type === "imageOverlay") {
      if (typeof props.alt !== "string" || !props.alt.trim()) {
        add(
          "image-alt",
          "error",
          "Image has no alt text. Describe it for screen readers, or set it to empty deliberately if it's decorative.",
        );
      }
    }
    if (block.type === "gallery" || block.type === "slider") {
      const images = Array.isArray(props.images) ? (props.images as { alt?: unknown }[]) : [];
      if (images.some((img) => typeof img?.alt !== "string" || !img.alt.trim())) {
        add("image-alt", "error", "One or more images in this block have no alt text.");
      }
    }

    // Links and buttons with nothing to announce.
    if (block.type === "button") {
      if (typeof props.label !== "string" || !props.label.trim()) {
        add("control-name", "error", "Button has no label, so it's announced as an unnamed control.");
      }
      if (typeof props.href !== "string" || !props.href.trim() || props.href === "#") {
        add("link-target", "warning", "Button links nowhere — it still receives focus but does nothing.");
      }
    }

    // Form fields without labels.
    if (block.type === "form") {
      const fields = Array.isArray(props.fields) ? (props.fields as { label?: unknown }[]) : [];
      if (fields.some((f) => typeof f?.label !== "string" || !f.label.trim())) {
        add("field-label", "error", "A form field has no label. Placeholder text is not a substitute.");
      }
    }

    // Contrast. A badge paints its own pill background from a fixed tone,
    // so its color isn't read against the section behind it.
    const colorKeys = TEXT_COLOR_KEYS[block.type];
    if (colorKeys && style.displayAs !== "badge") {
      const bg = parseColor(background);
      if (bg) {
        const size = Number.parseFloat(String(style.fontSize ?? "16"));
        const weight = Number.parseFloat(String(style.fontWeight ?? "400"));
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        const required = large ? 3 : 4.5;
        for (const { key, fallback } of colorKeys) {
          const raw = typeof style[key] === "string" && String(style[key]).trim() ? String(style[key]).trim() : fallback;
          const fg = parseColor(raw);
          if (!fg) continue;
          const ratio = contrastRatio(fg, bg);
          if (ratio < required) {
            add(
              "contrast",
              "error",
              `Text contrast is ${ratio.toFixed(2)}:1 against ${background} — WCAG AA needs ${required}:1 at this size.`,
            );
          }
        }
      }
    }

    if (block.type === "heading") {
      const level = Number.parseInt(String(props.level ?? "h2").replace("h", ""), 10);
      if (Number.isFinite(level)) headingLevels.push({ level, block, path });
    }

    (block.children ?? []).forEach((child, i) => visit(child, background, `${path} > ${child.type}[${i}]`));
  };

  visit(content.root, "#ffffff", content.root.type);

  // Heading structure, once the whole page is known.
  const h1s = headingLevels.filter((h) => h.level === 1);
  if (h1s.length === 0 && headingLevels.length > 0) {
    const first = headingLevels[0];
    issues.push({
      rule: "heading-order",
      severity: "warning",
      message: "This page has no h1. Screen-reader users navigate by heading level, and the top level is missing.",
      blockId: first.block.id,
      blockType: first.block.type,
      path: first.path,
    });
  }
  if (h1s.length > 1) {
    for (const extra of h1s.slice(1)) {
      issues.push({
        rule: "heading-order",
        severity: "warning",
        message: "More than one h1 on the page. Demote the others so the page has a single top-level heading.",
        blockId: extra.block.id,
        blockType: extra.block.type,
        path: extra.path,
      });
    }
  }
  for (let i = 1; i < headingLevels.length; i++) {
    const jump = headingLevels[i].level - headingLevels[i - 1].level;
    if (jump > 1) {
      issues.push({
        rule: "heading-order",
        severity: "warning",
        message: `Heading level jumps from h${headingLevels[i - 1].level} to h${headingLevels[i].level}, skipping a level.`,
        blockId: headingLevels[i].block.id,
        blockType: headingLevels[i].block.type,
        path: headingLevels[i].path,
      });
    }
  }

  return issues;
}
