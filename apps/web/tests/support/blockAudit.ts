import type { Block, PageContent } from "@/components/blocks/types";

// Tree-walking helpers for the template tests. Contrast checking used to
// live here too; it now lives in lib/a11y.ts, which the product itself
// runs — one implementation, so the templates are held to exactly the
// standard the accessibility panel reports to users.

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
