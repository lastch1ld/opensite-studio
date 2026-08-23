import type { ReactNode } from "react";

// Mirrors apps/web/components/blocks/types.ts's `Breakpoint`/`BlockStyle` —
// re-exported from there (not redefined) so there's exactly one
// definition. `base` holds the desktop/default values; `tablet`/`mobile`
// hold sparse per-breakpoint overrides. See apps/web/lib/responsiveStyle.ts
// for how these merge.
export type Breakpoint = "base" | "tablet" | "mobile";

export type BlockStyle = Partial<Record<Breakpoint, Record<string, unknown>>>;

// Describes one Inspector panel field for a block's `props` or `style`.
// Used by both built-in blocks (apps/web/components/blocks/registry.tsx)
// and plugin-authored ones — the Inspector (apps/web/components/editor/
// Inspector.tsx) renders the same field editor regardless of which
// registered the block.
export type FieldSchema = {
  key: string;
  label: string;
  // Plain-language alternative to `label`, shown instead of it when the
  // editor's "Simple mode" is on (docs/ui-ux-roadmap.md) — e.g. label
  // "Corner radius" / friendlyLabel "Rounded corners". Optional: falls
  // back to `label` when unset, for fields already plain enough (e.g.
  // "Text", "Link").
  friendlyLabel?: string;
  group: "props" | "style";
  input: "text" | "textarea" | "number" | "color" | "select" | "url" | "image" | "collectionSelect";
  options?: { label: string; value: string }[];
  // Props fields only: whether the Inspector should offer a "bind to
  // collection field" toggle alongside the literal-value input.
  bindable?: boolean;
  // Props fields only: whether this is a "text-bearing" field that can
  // carry a per-locale Translation override (docs/multilingual.md) — text
  // content, image alt text, button labels, etc. Drives both the
  // Inspector's locale-aware read/write (apps/web/components/editor/
  // Inspector.tsx) and BlockRenderer's resolveTranslatedProps
  // (apps/web/lib/translations.ts). Structural/config fields (layout, href,
  // variant, collection query params, ...) are never translatable — they
  // always edit the base block regardless of selected locale.
  translatable?: boolean;
  // Style fields only: which Theme token category this field may bind to
  // instead of a literal value.
  tokenCategory?: "colors" | "typography" | "spacing";
};

// Extra per-render info a block's `render()` receives beyond its resolved
// props/style/children: which block instance this is (`blockId`) and a
// host-supplied render context (`ctx`). apps/web's concrete `ctx` shape is
// `RenderContext` (lib/bind.ts — siteId/pageId/collection data); block-sdk
// stays agnostic of that shape since it's an opensite-studio app concept,
// not something a generic block registry needs to know about. A block
// definition that doesn't need `ctx` can ignore the type parameter.
export type BlockRenderMeta<TCtx = unknown> = {
  blockId: string;
  ctx: TCtx;
};

// The `registerBlock({ type, render, inspector, defaultProps })` interface
// from docs/plugins-and-extensibility.md, plus two fields the doc's sketch
// didn't spell out but that are load-bearing in the actual editor:
// `label` (palette button text, Inspector panel heading) and
// `defaultStyle` (a new block instance's initial `style.base`, see
// apps/web/components/blocks/registry.tsx's `createBlock`). Both are
// documented as part of the real API surface in docs/plugin-sdk.md rather
// than left as an undocumented extension.
export type BlockDefinition<TCtx = unknown> = {
  type: string;
  label: string;
  defaultProps: Record<string, unknown>;
  defaultStyle?: Record<string, unknown>;
  // Renders edge-to-edge regardless of an ancestor's padding (e.g.
  // apps/web/components/blocks/registry.tsx's "hero" block, via the
  // 100vw/-50vw CSS breakout). Purely horizontal on its own — a container
  // with top padding still leaves a visible gap above a full-bleed first
  // child, since the breakout only escapes the parent's box sideways, not
  // vertically. BlockRenderer.tsx reads this flag to cancel exactly that
  // gap (a matching negative margin-top) when such a block is the first
  // child of a container, rather than the container losing its padding
  // for every other child too.
  fullBleed?: boolean;
  inspector: FieldSchema[];
  render: (
    props: Record<string, unknown>,
    style: Record<string, unknown>,
    children: ReactNode,
    meta: BlockRenderMeta<TCtx>,
  ) => ReactNode;
};
