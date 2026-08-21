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
export function resolveBind(value: unknown, ctx: RenderContext): unknown {
  if (!isBind(value)) return value;
  const b = value.$bind;
  if (b.source === "currentItem") {
    return ctx.currentItem?.data?.[b.field];
  }
  const items = ctx.collectionItems?.[b.collectionId] ?? [];
  const item = b.itemId ? items.find((i) => i.id === b.itemId) : items[0];
  return item?.data?.[b.field];
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
