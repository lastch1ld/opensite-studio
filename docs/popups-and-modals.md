# Popups & Modals

Built. The Elementor "Popup Builder" pattern.

## Core concept

A Popup is a `Template` (theme-builder.md) of type `popup`: a normal block
tree, edited in the same editor as any Page/Template, rendered as an
overlay instead of inline in document flow. Reuses theme-builder.md's
targeting `Condition` for *which pages a popup is eligible on*, plus its
own **trigger** for *when* it fires on an eligible page — these are
separate concerns (eligibility vs timing) and shouldn't be collapsed into
one field.

```ts
type PopupTrigger =
  | { type: "pageLoad"; delaySeconds?: number }
  | { type: "scrollPercent"; percent: number }
  | { type: "exitIntent" }
  | { type: "elementClick"; blockId: string } // opened by a button/link block elsewhere on the page
  | { type: "collectionFieldEquals"; collectionId: string; field: string; value: unknown }; // conditional popup, e.g. show only for a specific dynamic item
```

Note the trigger union reuses the same condition-style shape as
collections.md's `Condition` for the data-driven case, rather than
inventing a fourth conditional-logic dialect in this doc.

## Behavior

- **Frequency control**: don't-show-again-for-N-days / show-once-per-
  session, tracked client-side (localStorage/cookie keyed by popup id) —
  no server round-trip needed for this, and it must respect the
  cookie-banner consent gate (integrations.md) if the mechanism used
  counts as non-essential storage.
- **Close behavior**: explicit close button block (a variant of the
  existing `button` block type with a `closesPopup` action) plus
  click-outside-to-close and Escape-key, each independently toggleable
  per popup.
- A popup's block tree can itself contain bound content (collections.md's
  `$bind`) — e.g. a "specific dynamic item" promo popup — and can contain
  a `form` block (see docs/forms.md) — the common "newsletter signup
  popup" and "exit-intent lead form" patterns.

## Rendering

Rendered by the public renderer (renderer.md) as an overlay portal
alongside the page's normal content; still goes through the same shared
block-renderer codepath (architecture.md) as everything else — a Popup is
not a special rendering system, just a Template rendered in an overlay
container instead of inline, with trigger-driven mount/unmount logic
layered on top in a thin client component.

## Editor UX implications

- Authored inside the Theme Builder area (theme-builder.md) alongside
  header/footer/page templates, not as a page-specific feature — a popup
  is site-scoped and can be assigned to multiple pages via its condition.
- Editor canvas needs an explicit "preview as overlay" toggle since a
  popup's own canvas editing happens out of normal document flow.
- Trigger configuration is a form in the Template's settings (not a block
  property) — trigger belongs to the Popup as a whole, not to any one
  block inside it.
