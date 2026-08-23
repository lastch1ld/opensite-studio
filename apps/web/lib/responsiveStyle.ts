import type { Block, Breakpoint, BlockStyle } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";

export const BREAKPOINTS: { id: Breakpoint; label: string; previewWidth: number }[] = [
  { id: "base", label: "Desktop", previewWidth: 1200 },
  { id: "tablet", label: "Tablet", previewWidth: 768 },
  { id: "mobile", label: "Mobile", previewWidth: 375 },
];

// Desktop-first cascade: tablet overrides base, mobile overrides tablet+base.
export function resolveStyle(style: BlockStyle | undefined, breakpoint: Breakpoint): Record<string, unknown> {
  const base = style?.base ?? {};
  if (breakpoint === "base") return base;
  const tablet = style?.tablet ?? {};
  if (breakpoint === "tablet") return { ...base, ...tablet };
  const mobile = style?.mobile ?? {};
  return { ...base, ...tablet, ...mobile };
}

function isTokenRef(v: unknown): v is { $token: string } {
  return typeof v === "object" && v !== null && typeof (v as { $token?: unknown }).$token === "string";
}

// Resolves a style bucket (already breakpoint-merged, or a single tablet/
// mobile override bucket) against a Theme: `{ $token: "colors.primary" }`
// entries become the theme's current value for that token; anything else
// (plain literals) passes through untouched. One shared path so editor and
// public renderer can never disagree on what a token resolves to.
export function resolveTokens(style: Record<string, unknown>, theme: ThemeTokens | null): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(style)) {
    if (!isTokenRef(value)) {
      out[key] = value;
      continue;
    }
    const [category, tokenKey] = value.$token.split(".");
    const bucket = theme?.[category as keyof ThemeTokens];
    out[key] = bucket?.[tokenKey];
  }
  return out;
}

function camelToKebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

// `!important` is required, not decorative: the public renderer always
// renders a block's *base* style values inline (`style={{...}}` on the
// DOM node — see components/blocks/registry.tsx's render functions), and
// an inline `style` attribute outranks any selector in a `<style>` block
// regardless of media-query specificity math. Without `!important` here,
// every tablet/mobile override in this file is dead weight — the base
// inline value always wins at every viewport width. (Confirmed live: a
// "columns" block's tablet/mobile column-count override rendered
// correctly in the *editor* — which re-renders per breakpoint tab rather
// than relying on CSS — but silently failed to apply on the real
// published page at an actual narrow viewport until this was added.)
function ruleBody(props: Record<string, unknown>): string {
  return Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${camelToKebab(k)}:${String(v)} !important;`)
    .join("");
}

// Generates the @media overrides for a block's tablet/mobile style, keyed by
// a `data-block-id` attribute set on that block's rendered root element.
// Mobile is emitted after tablet so, at widths where both media queries
// match, mobile wins by CSS source order without needing to merge by hand.
export function buildResponsiveCss(
  blockId: string,
  style: BlockStyle | undefined,
  theme: ThemeTokens | null = null,
): string | null {
  const tablet = resolveTokens(style?.tablet ?? {}, theme);
  const mobile = resolveTokens(style?.mobile ?? {}, theme);
  const parts: string[] = [];
  if (Object.keys(tablet).length) {
    parts.push(`@media (max-width:991px){[data-block-id="${blockId}"]{${ruleBody(tablet)}}}`);
  }
  if (Object.keys(mobile).length) {
    parts.push(`@media (max-width:767px){[data-block-id="${blockId}"]{${ruleBody(mobile)}}}`);
  }
  return parts.length ? parts.join("") : null;
}

export function hasContainerChildren(type: Block["type"]): boolean {
  return type === "section" || type === "hero" || type === "columns" || type === "list" || type === "marquee";
}

// Sensible default column-collapse for any grid-of-N-columns block
// ("columns", "list") — never a bare `1fr`-per-column grid held fixed
// across every width, which is what forces horizontal scrolling/cramped
// cells rather than a deliberate stacked layout on a narrower screen.
// Desktop keeps the authored count; tablet caps at 2; mobile always
// drops to 1. Applies automatically, not something a user configures per
// block — matching how every other page-builder's default grid behaves.
export function responsiveColumnCount(desktopCount: number, breakpoint: Breakpoint): number {
  if (breakpoint === "mobile") return 1;
  if (breakpoint === "tablet") return Math.min(desktopCount, 2);
  return desktopCount;
}

// The public renderer only ever renders once (desktop-context), so the
// same column-collapse the editor simulates by re-rendering per
// `activeBreakpoint` (see BlockRenderMeta.breakpoint) needs to *also*
// exist as real `@media` rules for an actual browser resize — this is
// that CSS, keyed off a `data-columns-id` attribute the block itself
// sets (see components/blocks/registry.tsx's "columns" and
// BlockRenderer.tsx's "list" handling), independent of
// buildResponsiveCss's own block-style-override mechanism above (column
// count is derived from `props`, not a `style` bucket).
export function columnsResponsiveCss(blockId: string, desktopCount: number): string {
  const tabletCount = responsiveColumnCount(desktopCount, "tablet");
  // `!important` for the same reason as ruleBody() above — the base
  // column count is set inline (`style={{gridTemplateColumns:...}}`) on
  // the same element these rules target.
  return `@media (max-width:991px){[data-columns-id="${blockId}"]{grid-template-columns:repeat(${tabletCount},1fr) !important}}@media (max-width:767px){[data-columns-id="${blockId}"]{grid-template-columns:repeat(1,1fr) !important}}`;
}
