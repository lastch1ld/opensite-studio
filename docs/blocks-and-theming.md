# Block Library & Theming

## MVP `[ ]`

A small **block registry**: a plain object/map from `type` string → `{
render(props, style, children) => ReactNode, inspector: FieldSchema[],
defaultProps }`. Used identically by editor canvas and public renderer
(architecture.md).

Minimal block set to prove the pattern end-to-end:
- `section` — container, root/nesting block (padding, background, layout: stack/row).
- `text` — rich-ish text (bold/italic/link), font size/weight/color via style.
- `image` — src, alt, object-fit.
- `button` — label, href, variant.

No theming system in the MVP — block `style` holds literal values
(hex colors, px sizes) rather than references into a Theme.

## Needed for full parity `[ ]`

- **Full block set**: heading, spacer/divider, video embed, gallery/carousel,
  icon, form (ties to `FormSubmission`), map embed, columns/grid layout,
  accordion/tabs, social icons row, HTML embed (escape hatch), navbar/menu,
  footer.
- **Theme tokens** (`Theme` table, data-model.md): color palette (with
  semantic roles: primary/secondary/background/text), typography scale,
  spacing scale. Blocks reference tokens (`color: "primary"`) instead of
  literals so a theme edit cascades site-wide.
- **Theme editor UI** — global panel to edit tokens with live preview
  across the whole page (see editor.md).
- **Per-breakpoint style overrides** on every block (editor.md).
- **Saved/reusable blocks ("symbols")** — data-model.md `Component` table.
- **Block-level animations/interactions** (scroll-triggered reveal, hover
  effects) — an Elementor-parity feature, meaningful scope on its own.
- **Layout engine beyond stack/row** — full flex/grid controls exposed
  per-section (Elementor's "flexbox container" feature).
- **Block versioning** — if a block's prop schema changes, old stored
  instances need a migration path (ties into `PageContent.version` in
  data-model.md).
