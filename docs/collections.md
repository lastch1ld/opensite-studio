# Collections, Dynamic Pages & Conditional/Dynamic Binding

Not part of Phase 0/1. This is the single largest missing architectural
piece identified against Wix/Elementor (see docs/roadmap.md) — it's what
turns static Pages into a real data-driven site (blogs, directories,
portfolios, listings) without bespoke code per site. Explicitly excludes
ecommerce (product/cart/checkout) and any analytics/reporting dashboard —
those are out of scope for this project.

## Core concept

A **Collection** is a user-defined, typed dataset (like a lightweight
headless-CMS table) scoped to a Site: a name, a set of fields (text, rich
text, number, boolean, date, image/media reference, reference-to-another-
collection), and rows (**CollectionItems**) of data conforming to that
schema. This is new scope beyond data-model.md's MVP tables — a
`Collection` (id, siteId, name, fieldSchema Json) and `CollectionItem` (id,
collectionId, data Json) pair, analogous to how `Page` already models
schema-in-Json-column for flexibility without a full dynamic-table system.

Two ways a site uses a Collection:

1. **Dynamic/repeater pages** — a `Page` can be marked as bound to a
   Collection (`Page.collectionId`, nullable) instead of being a single
   static page. One "template" block tree is authored once; the renderer
   generates one route per CollectionItem (e.g. `/blog/{item.slug}`) by
   substituting bound fields into the template at render time. This is the
   Wix "dynamic pages" pattern.
2. **Dynamic binding inside any page** — an individual block's props can
   be bound to a Collection field instead of (or in addition to) a literal
   value — e.g. a `text` block's content bound to `item.title`, an `image`
   block's src bound to `item.coverImage`. This is the Elementor "dynamic
   tags" pattern, applied per-block-property rather than only at the
   whole-page level.

## Binding model

Extend `Block.props` values to optionally be a **binding reference**
instead of a literal:

```ts
type BoundValue<T> =
  | T
  | { $bind: { source: "collection"; collectionId: string; field: string; itemId?: string } }
  | { $bind: { source: "currentItem"; field: string } }; // used inside a dynamic/repeater page's template
```

`source: "currentItem"` is what a dynamic page's template block tree uses
to reference "whichever CollectionItem this rendered instance is for."
`source: "collection"` with a fixed `itemId` (or a query, for a list/grid
block that renders N items) is what a *static* page uses to pull in data
from a collection without itself being a repeater — e.g. a homepage
"latest 3 posts" block. Both the editor canvas and the public renderer
resolve `$bind` values through the same lookup function (matches the
architecture.md rule of one shared rendering codepath) — the editor
resolves against live/draft collection data for preview, the public
renderer against published collection state.

A **list/grid block** type is the natural companion: bound to a
Collection + a query (filter/sort/limit), it renders its child block
subtree once per matched item — the mechanism behind "latest posts," "team
grid," "product-like listing" patterns, without needing ecommerce-specific
blocks.

## Conditional visibility

Independent of data binding but sharing infrastructure with it: a block
(or a whole Page, or a Popup — see popups-and-modals.md) can carry a
**condition** controlling whether it renders at all:

```ts
type Condition =
  | { type: "always" }
  | { type: "collectionFieldEquals"; collectionId: string; field: string; value: unknown }
  | { type: "deviceIs"; device: "desktop" | "tablet" | "mobile" }
  | { type: "and" | "or"; conditions: Condition[] };
```

Starts intentionally small (device + collection-field-equality + boolean
combinators) rather than a full rules engine — matches this project's
"minimal scope that proves the pattern" approach elsewhere (e.g.
blocks-and-theming.md's initial 4-block set). Extend the condition-type
union later (e.g. member-logged-in, once Members Area-equivalent auth
exists) rather than redesigning the shape.

## Editor UX implications

- Inspector (editor.md) gains a "bind to collection field" option per
  applicable prop, alongside the existing literal-value input — a toggle,
  not a separate mode.
- A new "Collections" panel in the dashboard to define collections/fields
  and manage CollectionItem rows (a basic data-grid CRUD UI — not a
  spreadsheet-grade editor).
- Dynamic pages show a "template" badge in the layers/page list since one
  Page authors many rendered routes.

## Explicitly out of scope here

- Ecommerce-specific collection behavior (inventory, pricing, cart) — a
  Collection is generic typed data, not a product catalog primitive.
  Revisit only if ecommerce is ever prioritized (currently excluded).
- Any analytics/reporting dashboard over collection data.
- Relational query depth beyond single-level reference fields (e.g. no
  multi-hop joins in the MVP of this feature).
