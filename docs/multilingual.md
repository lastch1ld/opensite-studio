# Multilingual

Not part of Phase 0/1/2/3. Previously just a one-line placeholder in
renderer.md and a Phase 4 roadmap bullet — this doc gives it an actual
design, informed by collections.md and theme-builder.md already existing
(a multilingual system built before those would have had to be redone).

## Core concept

A Site declares a set of supported **Locales** (e.g. `en`, `de`, `it`) with
one marked default. Content — Pages, Templates (theme-builder.md), and
CollectionItems (collections.md) — gets **per-locale overrides** on top of
a base/default-locale version, rather than being fully duplicated per
language. This mirrors Wix Multilingual's model (translate what differs,
inherit the rest) instead of a naive "copy the whole site per language"
approach, which would fight the Theme Builder's single-header/footer
premise and the Collections' single-dataset premise.

## Data model implications

- `Locale` table: id, siteId, code (e.g. `en-US`), label, isDefault.
- **Page/Template translation**: rather than forking `Block` trees wholesale
  per locale (expensive to keep in sync as structure changes), only
  *translatable field values* within a block tree get overridden per
  locale — text content, image alt text, button labels, meta title/
  description. A `Translation` table (id, siteId, localeId, entityType
  [`page`/`template`/`collectionItem`], entityId, blockId nullable,
  field, value) holds these as sparse overrides; structural
  changes (adding/removing/reordering blocks) always happen on the base
  version and apply to every locale automatically.
- **Collection field translation**: same `Translation` table covers
  `collectionItem` rows — a field marked translatable on the Collection's
  schema (collections.md) gets a value per locale; non-translatable fields
  (e.g. a price, a date) are shared across locales by definition.
- `$bind`-resolved content (collections.md) and Theme Builder-resolved
  content (theme-builder.md) both need to resolve through the active
  locale's `Translation` overrides — one resolution path, not a
  locale-aware version of the block renderer plus a separate
  locale-unaware one.

## Routing

Locale-prefixed paths (`/de/about`, default locale unprefixed or also
prefixed — configurable per Site) resolved in the public renderer
(renderer.md) alongside its existing host→Site, path→Page resolution: host
→ Site → locale segment → Locale → path → Page, then render with that
Locale's `Translation` overrides applied. `hreflang` tags emitted per page
for SEO (integrations.md) once this exists.

## Editor UX implications

- A locale switcher in the editor (editor.md), scoped similarly to the
  responsive-breakpoint switcher already planned there: switching locale
  doesn't change structure, it changes which `Translation` values the
  Inspector reads/writes for text-bearing props.
- Fields/blocks with no translation yet for the active locale visibly fall
  back to the default-locale value (with an indicator it's untranslated)
  rather than rendering empty — matches Wix's "shows default until
  translated" behavior and avoids accidentally shipping blank content.
- Collections dashboard panel (collections.md) gains a per-field
  "translatable" toggle when defining a Collection's schema.

## Explicitly out of scope for the initial version

- Machine-translation auto-fill (Wix offers this as an add-on) — pure
  manual translation entry first; auto-fill is a later enhancement that
  plugs into the same `Translation` table, not a different mechanism.
- Right-to-left layout support — a real requirement eventually, but
  layout-direction handling is a rendering/CSS concern separable from the
  data-model work in this doc; note it here so it isn't forgotten, not
  designed here.
