import type { Block, Breakpoint, BlockStyle } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";

export const BREAKPOINTS: { id: Breakpoint; label: string; previewWidth: number }[] = [
  { id: "base", label: "Desktop", previewWidth: 1200 },
  { id: "tablet", label: "Tablet", previewWidth: 768 },
  { id: "mobile", label: "Mobile", previewWidth: 375 },
];

// Automatic down-scaling of type and spacing at narrower breakpoints —
// the same "applies automatically, not configured per block" contract as
// responsiveColumnCount below, and the thing every page builder does that
// a naive breakpoint-override system doesn't: a 104px desktop headline
// that nobody wrote a mobile override for is 104px on a 375px screen,
// which is not a design decision anyone made.
//
// Only scales *down*, only px values, and only past a floor — shrinking
// 16px body copy to 11px would trade one unreadable layout for another.
// An explicit tablet/mobile override always wins over the derived value:
// this fills the gap where the author said nothing, it doesn't overrule
// them.
const SCALE_FACTORS: Record<Exclude<Breakpoint, "base">, { type: number; space: number }> = {
  tablet: { type: 0.85, space: 0.8 },
  mobile: { type: 0.72, space: 0.62 },
};

const TYPE_KEYS = ["fontSize", "valueFontSize"];
const SPACE_KEYS = ["padding", "gap", "margin", "marginTop", "marginBottom", "rowGap", "columnGap"];

const TYPE_FLOOR_PX = 16;
const SPACE_FLOOR_PX = 12;

/** Scales every px component of a value ("96px 40px" -> "69px 29px"), leaving non-px values alone. */
function scalePxValue(value: string, factor: number, floor: number): string | null {
  if (!/\dpx/.test(value)) return null;
  let changed = false;
  const scaled = value.replace(/(-?\d*\.?\d+)px/g, (_match, num: string) => {
    const n = Number(num);
    if (!Number.isFinite(n) || Math.abs(n) <= floor) return `${num}px`;
    const next = Math.max(floor, Math.round(Math.abs(n) * factor)) * Math.sign(n);
    if (next !== n) changed = true;
    return `${next}px`;
  });
  return changed ? scaled : null;
}

/** The derived tablet/mobile values for a base style — only keys that actually change. */
export function autoScaleStyle(base: Record<string, unknown>, breakpoint: Exclude<Breakpoint, "base">): Record<string, unknown> {
  const { type, space } = SCALE_FACTORS[breakpoint];
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(base)) {
    if (typeof value !== "string") continue;
    const isType = TYPE_KEYS.includes(key);
    const isSpace = SPACE_KEYS.includes(key);
    if (!isType && !isSpace) continue;
    const scaled = scalePxValue(value, isType ? type : space, isType ? TYPE_FLOOR_PX : SPACE_FLOOR_PX);
    if (scaled !== null) out[key] = scaled;
  }
  return out;
}

// Desktop-first cascade: auto-scaled base, then tablet, then mobile — each
// later source overriding the earlier one, so anything the author set
// explicitly beats what was derived for them.
export function resolveStyle(style: BlockStyle | undefined, breakpoint: Breakpoint): Record<string, unknown> {
  const base = style?.base ?? {};
  if (breakpoint === "base") return base;
  const tablet = style?.tablet ?? {};
  if (breakpoint === "tablet") return { ...base, ...autoScaleStyle(base, "tablet"), ...tablet };
  const mobile = style?.mobile ?? {};
  return { ...base, ...autoScaleStyle(base, "mobile"), ...tablet, ...mobile };
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

// Every string this file interpolates into CSS comes out of a page's block
// tree, and app/api/sites/[siteId]/pages/[pageId] stores that tree as the
// opaque JSON blob the client sent — block ids and style values included.
// The CSS then ships inside a <style dangerouslySetInnerHTML> on the public
// page *and* on the editor canvas, which is the dashboard's own origin, so
// nothing reaching this file can be treated as author-trusted.
//
// Two escaping problems, because these are two different CSS contexts:

// (a) A value inside an attribute selector's quoted string. Rewriting it as
// CSS hex escapes leaves the *value* identical — `\3c ` parses back to
// `<`, so the selector still matches the element's real data-block-id —
// while removing the literal characters that would end the string, or the
// <style> element, early. An HTML parser closes a <style> on the byte
// sequence "</style" whatever CSS thinks of it, which is why `<` and `>`
// are escaped here and not just the quote.
const CSS_STRING_ESCAPE = /["'<>\\\r\n\f\u0000-\u001f]/g;

export function cssStringValue(value: string): string {
  return value.replace(CSS_STRING_ESCAPE, (ch) => `\\${ch.codePointAt(0)!.toString(16)} `);
}

// (b) A declaration is not a string, so the same trick doesn't apply: there
// is no encoding of `}` that still closes the declaration block for the
// property parser but not for the block parser. Declarations that don't look
// like declarations are dropped instead. Legitimate values keep working —
// commas, quotes, parens and slashes are all still allowed, so font stacks,
// rgb()/var()/calc() and shorthand values pass through untouched.
const CSS_PROPERTY = /^-{0,2}[a-z][a-z0-9-]*$/;
const CSS_VALUE_UNSAFE = /[<>{};@\\]|\/\*/;

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
    .map(([k, v]) => [camelToKebab(k), String(v)] as const)
    .filter(([property, value]) => CSS_PROPERTY.test(property) && !CSS_VALUE_UNSAFE.test(value))
    .map(([property, value]) => `${property}:${value} !important;`)
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
  // Tokens are resolved before scaling: a `{ $token: "typography.xl" }`
  // font size is "32px" by the time it reaches autoScaleStyle, and a token
  // that resolves to something non-px is simply left alone.
  const resolvedBase = resolveTokens(style?.base ?? {}, theme);
  const tablet = { ...autoScaleStyle(resolvedBase, "tablet"), ...resolveTokens(style?.tablet ?? {}, theme) };
  const mobile = {
    ...autoScaleStyle(resolvedBase, "mobile"),
    ...resolveTokens(style?.tablet ?? {}, theme),
    ...resolveTokens(style?.mobile ?? {}, theme),
  };
  const id = cssStringValue(blockId);
  const parts: string[] = [];
  if (Object.keys(tablet).length) {
    parts.push(`@media (max-width:991px){[data-block-id="${id}"]{${ruleBody(tablet)}}}`);
  }
  if (Object.keys(mobile).length) {
    parts.push(`@media (max-width:767px){[data-block-id="${id}"]{${ruleBody(mobile)}}}`);
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
  const id = cssStringValue(blockId);
  return `@media (max-width:991px){[data-columns-id="${id}"]{grid-template-columns:repeat(${tabletCount},1fr) !important}}@media (max-width:767px){[data-columns-id="${id}"]{grid-template-columns:repeat(1,1fr) !important}}`;
}
