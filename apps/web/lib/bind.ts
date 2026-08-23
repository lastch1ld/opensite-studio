import { resolveTranslatedValue } from "./translations";

export type CollectionItemLite = { id: string; data: Record<string, unknown> };

// Threaded through BlockRenderer for both editor canvas and public
// renderer: `device` drives `deviceIs` conditions, `collectionItems` is
// every CollectionItem for the site keyed by collectionId (so a static
// page's block can bind to any collection, not just the one it repeats
// over), and `currentItem` is "whichever CollectionItem this render pass
// is for" inside a dynamic/repeater page or a list/grid block's subtree.
export type RenderContext = {
  device: "desktop" | "tablet" | "mobile";
  collectionItems?: Record<string, CollectionItemLite[]>;
  currentItem?: (CollectionItemLite & { collectionId: string }) | null;
  // Needed by the `form` block to submit against the right Site/Page (see
  // components/blocks/FormBlock.tsx) — undefined in editor canvas contexts
  // that don't correspond to a real Page (e.g. Theme Builder templates).
  siteId?: string;
  pageId?: string;
  // docs/multilingual.md. `localeId` null/undefined means "default locale,
  // no overrides to look up" (the common case — most renders never touch
  // this). `translations` is the whole site+locale's Translation rows,
  // bulk-loaded once (lib/translations.ts's loadTranslationsMap) and
  // resolved per-field via resolveTranslatedValue/resolveTranslatedProps,
  // same shared-resolution shape as $token/$bind. `translationEntity`
  // identifies which Page or Template the block tree being rendered right
  // now belongs to (PublishedPage.tsx sets it per header/body/footer/popup
  // slot; EditorClient.tsx sets it once for whichever entity is open) —
  // block-level translations are keyed by (entityType, entityId, blockId).
  localeId?: string | null;
  translations?: Record<string, string>;
  translationEntity?: { type: "page" | "template"; id: string };
};

type BindSource =
  | { source: "collection"; collectionId: string; field: string; itemId?: string }
  | { source: "currentItem"; field: string };

export type BoundValue<T> = T | { $bind: BindSource };

function isBind(v: unknown): v is { $bind: BindSource } {
  return typeof v === "object" && v !== null && typeof (v as { $bind?: unknown }).$bind === "object";
}

// Resolves one prop value against a RenderContext: literals pass through
// untouched, `{ $bind }` entries are looked up. Mirrors resolveTokens in
// lib/responsiveStyle.ts for `$token` — one shared path so editor preview
// and public renderer can never disagree on what a binding resolves to.
//
// When the resolved value came from a CollectionItem and a non-default
// locale is active, it's additionally passed through
// resolveTranslatedValue (docs/multilingual.md's `collectionItem`
// Translation rows: entityId is the item's id, field is the bound
// CollectionField key, blockId is always null since a CollectionItem field
// isn't tied to any one block). Only string values are eligible — matches
// Translation.value's column type and the doc's "a price, a date" example
// of fields that are simply never translatable.
export function resolveBind(value: unknown, ctx: RenderContext): unknown {
  if (!isBind(value)) return value;
  const b = value.$bind;
  const item = b.source === "currentItem" ? ctx.currentItem : resolveCollectionItem(b, ctx);
  const base = item?.data?.[b.field];
  if (!item || typeof base !== "string") return base;
  const { value: resolved } = resolveTranslatedValue(
    ctx.translations,
    { entityType: "collectionItem", entityId: item.id, blockId: null, field: b.field },
    base,
  );
  return resolved;
}

function resolveCollectionItem(
  b: Extract<BindSource, { source: "collection" }>,
  ctx: RenderContext,
): CollectionItemLite | undefined {
  const items = ctx.collectionItems?.[b.collectionId] ?? [];
  return b.itemId ? items.find((i) => i.id === b.itemId) : items[0];
}

export function resolveBoundProps(props: Record<string, unknown>, ctx: RenderContext): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    out[key] = resolveBind(value, ctx);
  }
  return out;
}

// Filter/sort/limit for a list/grid block's bound Collection query. Reads
// the block's raw (unresolved) props — these are query configuration, not
// bindable content.
export function queryListItems(items: CollectionItemLite[], props: Record<string, unknown>): CollectionItemLite[] {
  const filterField = typeof props.filterField === "string" ? props.filterField : "";
  const filterValue = typeof props.filterValue === "string" ? props.filterValue : "";
  let result = items;
  if (filterField) {
    result = result.filter((item) => String(item.data?.[filterField] ?? "") === filterValue);
  }
  const sortField = typeof props.sortField === "string" ? props.sortField : "";
  if (sortField) {
    result = [...result].sort((a, b) => {
      const av = a.data?.[sortField];
      const bv = b.data?.[sortField];
      if (av === bv) return 0;
      return (av as string | number) > (bv as string | number) ? 1 : -1;
    });
    if (props.sortDir === "desc") result = result.reverse();
  }
  const limit = Number(props.limit);
  if (Number.isFinite(limit) && limit > 0) result = result.slice(0, limit);
  return result;
}
