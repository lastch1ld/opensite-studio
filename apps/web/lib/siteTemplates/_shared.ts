import type { Block } from "@/components/blocks/types";
import { randomUUID } from "crypto";

// Shared building blocks for every genre's full site template
// (lib/siteTemplates/<genre>.ts, e.g. saas.ts). Split into its own module
// so each genre file can be authored/edited independently — including in
// parallel, by separate agents — without touching one shared growing
// file (docs/site-templates-plan.md's "Suggested subagent use").

export function mk(type: string, props: Record<string, unknown>, style: Record<string, unknown>, children?: Block[]): Block {
  return { id: randomUUID(), type, props, style: { base: style }, children };
}

export function heading(text: string, opts: { size: string; color: string; align?: string; level?: string; weight?: string; font?: string; animation?: string }): Block {
  return mk(
    "heading",
    { text, level: opts.level ?? "h2" },
    {
      fontSize: opts.size,
      fontWeight: opts.weight ?? "700",
      color: opts.color,
      textAlign: opts.align ?? "left",
      ...(opts.font ? { fontFamily: opts.font } : {}),
      ...(opts.animation ? { animation: opts.animation } : {}),
    },
  );
}

export function body(text: string, opts: { size?: string; color: string; align?: string; weight?: string; font?: string }): Block {
  return mk(
    "text",
    { content: text },
    {
      fontSize: opts.size ?? "17px",
      fontWeight: opts.weight ?? "400",
      color: opts.color,
      textAlign: opts.align ?? "left",
      ...(opts.font ? { fontFamily: opts.font } : {}),
    },
  );
}

/**
 * A real pill/trust badge — `text` block's own `displayAs: "badge"` mode
 * (verified in registry.tsx: renders as an inline-block pill using one of
 * four fixed `BADGE_TONES`, not an arbitrary color — "neutral" is the
 * generic choice that works on any background). Matches the rating/
 * credential/availability pill pattern real reference sites (Plumbzo,
 * Flow's Plumbing, Kora) use for trust signals — a badge earns its place
 * here because it states a fact (a rating, a license, an availability
 * window), unlike a purely decorative eyebrow label.
 */
export function badge(text: string, opts: { tone?: "neutral" | "success" | "warning" | "danger"; offsetX?: string; offsetY?: string; zIndex?: string } = {}): Block {
  return mk(
    "text",
    { content: text },
    {
      displayAs: "badge",
      badgeTone: opts.tone ?? "neutral",
      fontSize: "13px",
      fontWeight: "600",
      ...(opts.offsetX ? { offsetX: opts.offsetX } : {}),
      ...(opts.offsetY ? { offsetY: opts.offsetY } : {}),
      ...(opts.zIndex ? { zIndex: opts.zIndex } : {}),
    },
  );
}

export function cta(label: string, opts: { background: string; color: string; variant?: string }): Block {
  return mk(
    "button",
    { label, href: "#", variant: opts.variant ?? "primary" },
    { padding: "15px 30px", borderRadius: "8px", fontSize: "16px", fontWeight: "600", background: opts.background, color: opts.color },
  );
}

/**
 * Full-bleed background band wrapping a centered, width-capped content
 * column — every genre's recurring section shape. `outerExtra` reaches the
 * *outer* (background-bearing) section — e.g. `{ backgroundTexture: "grain" }`,
 * a real, separately-verified working style key (`section`'s render layers
 * a noise data-URI via `backgroundImage`, distinct from the `background`
 * style key itself, which only ever becomes `background-color` and cannot
 * hold a gradient/image) — genuine textural depth on a flat-color band.
 */
export function bleed(
  background: string,
  padding: string,
  content: Block[],
  contentWidth = "1100px",
  gap = "24px",
  extra: Record<string, unknown> = {},
  outerExtra: Record<string, unknown> = {},
): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background, padding, align: "center", gap: "0", ...outerExtra },
    [mk("section", { layout: "stack" }, { background: "transparent", padding: "0", maxWidth: contentWidth, align: "center", gap, ...extra }, content)],
  );
}
