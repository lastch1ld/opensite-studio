# Theme Builder (Site-Wide Templates with Conditions)

Not part of Phase 0/1. Distinct from — and a bigger scope than —
blocks-and-theming.md's design-token theming. Token theming answers "what
colors/fonts does everything use"; Theme Builder answers "what renders the
header, footer, and per-content-type layout, and under what conditions."
This is the Elementor "Theme Builder" pattern.

## Core concept

A **Template** is a saved block tree (same `Block` shape as a Page, per
data-model.md) tagged with a **template type** and a **condition** for
where it applies:

- `header`, `footer` — site chrome rendered around every Page unless a
  Page opts out.
- `pageTemplate` — a full-page layout applied to Pages matching its
  condition, instead of each Page authoring its own root section from
  scratch.
- `collectionItemTemplate` — the "template" a dynamic/repeater Page uses
  per collections.md; formalized here as one Template *type* rather than a
  bolt-on field on Page, so header/footer/page templates and
  collection-item templates share one targeting/condition mechanism
  instead of three different ones.
- `popup` — see popups-and-modals.md; a Popup is a Template with its own
  trigger rules layered on top of the same condition system.

## Targeting

Reuses collections.md's `Condition` type for "which Pages/items does this
Template apply to" — e.g. `{ type: "always" }` for a site's one header, or
`{ type: "collectionFieldEquals", collectionId: "...", field: "category",
value: "blog" }` to target only blog-collection dynamic pages. This is
deliberately the same condition primitive as block-level conditional
visibility, not a parallel targeting language — one condition engine used
in three places (block visibility, template targeting, popup triggers).

When multiple Templates of the same type could match a given Page
(e.g. two `pageTemplate`s both matching), the more specific condition wins
(a non-`always` condition beats `always`); exact tie-break/priority
ordering is a detail to settle at implementation time, not in this doc.

## Data model implications

- New `Template` table: id, siteId, type (header/footer/pageTemplate/
  collectionItemTemplate/popup), name, content (Json block tree),
  condition (Json), priority (int, for tie-breaking), timestamps.
- `Page` no longer needs its own `collectionId` binding from
  collections.md's dynamic-pages section once `collectionItemTemplate`
  exists as a Template type — collections.md's initial sketch is superseded
  by this doc for that specific mechanism; keep collections.md's binding
  model (`$bind` on block props) as-is, it's still how a template
  references the current item's fields.
- Renderer (renderer.md) resolves, for a given Page render: matching
  header Template + matching footer Template + (the Page's own content, OR
  a matching pageTemplate/collectionItemTemplate's content if the Page is
  template-driven) — composed into the final render, still through the
  same shared block-renderer codepath as everything else.

## Editor UX implications

- A "Theme Builder" section in the dashboard (separate from per-page
  editing) to create/edit Templates, each opened in the same canvas/
  layers/inspector editor (editor.md) already used for Pages — no
  second editor implementation, just a different content source and an
  added "condition" configuration step.
- Editing a header/footer Template previews live across representative
  pages, not just in isolation, so changes are trustworthy before
  publishing (mirrors architecture.md's "what you see while editing is
  what ships" guarantee).

## Sequencing note

Depends on collections.md's `Condition` type existing first. Reasonable to
build header/footer + pageTemplate (no collection dependency) before
tackling collectionItemTemplate, if it's ever split into sub-steps.
