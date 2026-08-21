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

function ruleBody(props: Record<string, unknown>): string {
  return Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${camelToKebab(k)}:${String(v)};`)
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
  return type === "section" || type === "columns" || type === "list";
}
