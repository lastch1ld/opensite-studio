# Live Editor

## Built

- Canvas renders the current page's `Block` tree using the **same block
  renderer components** the public site uses (see architecture.md), inside
  an editable wrapper that adds selection outlines + click-to-select.
- Left panel: **layers tree** (the block hierarchy, expand/collapse).
- Right panel: **inspector** — shows props for the selected block, editable
  via plain form controls (text input, color picker, number/select) that
  write into the block's `props`/`style` and re-render immediately.
- Top toolbar: block palette to **add** a new block (appended into selected
  container, or root), **delete** selected block, **Publish** button.
- Autosave: debounced PATCH of `draftContent` to the API on every tree
  mutation (~1s debounce), so the editor never has an explicit "Save" step.
- No drag-and-drop reordering in the very first MVP slice — add/select/edit
  props/delete is enough to prove the live-editing loop end-to-end; DnD
  reordering is the next increment once that loop works.

## Needed for full parity `[ ]`

- **Drag-and-drop** — dragging blocks from palette onto canvas at an
  arbitrary drop position, and reordering/reparenting existing blocks by
  drag. Needs a DnD library (e.g. `@dnd-kit`) and drop-position math against
  the live-rendered canvas (likely via an iframe — see below).
- **Iframe-isolated canvas** — rendering the page inside an `<iframe>` with
  its own document so the site's own CSS doesn't leak into/from the editor
  chrome, and so responsive-breakpoint preview (see below) is a real
  viewport resize rather than a CSS trick.
- **Responsive breakpoint editing** — desktop/tablet/mobile toggle, with
  per-breakpoint style overrides stored per block (Wix/Elementor both let
  you set different padding/font-size/visibility per breakpoint).

  Since 2026-08-28 those overrides sit on top of an **automatic
  down-scale** (`lib/responsiveStyle.ts`'s `autoScaleStyle`): type and
  spacing values shrink proportionally at tablet and mobile unless the
  author set something explicit there. Wix's own "responsive toggle" is
  this, and it's the difference between a 104px desktop headline being a
  design decision and being 104px on a 375px phone because nobody wrote
  an override. Constrained deliberately: down only, px values only, never
  below a readability floor (16px type, 12px spacing), never on keys that
  aren't type or spacing, and always beaten by an explicit override —
  the same "applies automatically, not configured per block" contract
  `responsiveColumnCount` already established for grid collapse.
- **Undo/redo stack** — command-based history over block-tree mutations,
  not just relying on browser undo.
- **Multi-select + copy/paste/duplicate** blocks.
- **Inline direct-manipulation editing** — resize/drag a block's box on
  canvas (not just via inspector number fields), double-click text to edit
  in place.
- **Keyboard shortcuts** (delete, duplicate, arrow-key nudge, etc).
- **Global style / theme editing panel** — separate from per-block style,
  edits Theme tokens (data-model.md) and previews cascading changes live.
- **Saved/reusable blocks ("symbols")** — save a subtree as a named
  component, insert elsewhere, optionally keep them linked so editing one
  instance updates all (Elementor "global widgets" behavior).
- **Collaborative editing** (multiple users editing live) — would need a
  presence/CRDT layer; explicitly out of scope until multi-seat teams exist
  (see auth.md Membership).
- **Version history UI** — browse/restore Revisions from data-model.md.
- **Preview mode** — view the draft as an end visitor would, without editor
  chrome, before publishing.
