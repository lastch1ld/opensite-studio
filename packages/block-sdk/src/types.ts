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
  group: "props" | "style";
  input: "text" | "textarea" | "number" | "color" | "select" | "url" | "image" | "collectionSelect";
  options?: { label: string; value: string }[];
  // Props fields only: whether the Inspector should offer a "bind to
  // collection field" toggle alongside the literal-value input.
  bindable?: boolean;
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
  inspector: FieldSchema[];
  render: (
    props: Record<string, unknown>,
    style: Record<string, unknown>,
    children: ReactNode,
    meta: BlockRenderMeta<TCtx>,
  ) => ReactNode;
};
