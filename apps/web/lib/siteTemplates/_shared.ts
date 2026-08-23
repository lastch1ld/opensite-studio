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

export function heading(text: string, opts: { size: string; color: string; align?: string; level?: string; weight?: string; font?: string }): Block {
  return mk(
    "heading",
    { text, level: opts.level ?? "h2" },
    {
      fontSize: opts.size,
      fontWeight: opts.weight ?? "700",
      color: opts.color,
      textAlign: opts.align ?? "left",
      ...(opts.font ? { fontFamily: opts.font } : {}),
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

export function cta(label: string, opts: { background: string; color: string; variant?: string }): Block {
  return mk(
    "button",
    { label, href: "#", variant: opts.variant ?? "primary" },
    { padding: "15px 30px", borderRadius: "8px", fontSize: "16px", fontWeight: "600", background: opts.background, color: opts.color },
  );
}

/** Full-bleed background band wrapping a centered, width-capped content column — every genre's recurring section shape. */
export function bleed(background: string, padding: string, content: Block[], contentWidth = "1100px", gap = "24px", extra: Record<string, unknown> = {}): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background, padding, align: "center", gap: "0" },
    [mk("section", { layout: "stack" }, { background: "transparent", padding: "0", maxWidth: contentWidth, align: "center", gap, ...extra }, content)],
  );
}
