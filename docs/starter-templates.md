# Starter Templates (reusing `blog-template` / "Aperture")

Not part of Phase 0. Documented so the port is deliberate, not ad hoc, when
it's picked up.

## Source

`../blog-template` (a separate local repo, "Aperture") — an existing
Next.js blog template with: Hero/Gallery/Slider content blocks, SEO+GEO
`<head>` handling (OG/Twitter/JSON-LD, `llms.txt`, sitemap/robots),
light/dark theme, newsletter form with pluggable backends
(ConvertKit/Mailchimp/webhook), and analytics adapters
(Plausible/GA4/Umami). It uses **Decap CMS** + flat `.mdx` files under
`content/posts/` as its authoring model.

## What we take

- **Presentational components**: `Hero` (3 variants), `Gallery`,
  `Slider`, blog list/post layout, tag pages, theme toggle — ported into
  this project's block registry (blocks-and-theming.md) as new block
  types, replacing their MDX-prop-driven API with our `Block.props`/`style`
  shape.
- **SEO + GEO implementation** (`src/components/seo/`, `llms.txt` route,
  sitemap/robots generation, JSON-LD helpers) — this is close to a direct
  match for integrations.md's SEO/GEO section; port the logic, wire it to
  our `Page`/`Site` fields instead of MDX frontmatter.
- **Newsletter form + provider adapters** — matches integrations.md's
  Newsletter section; port the adapter pattern (ConvertKit/Mailchimp/
  webhook) directly.
- **Analytics adapters** (Plausible/GA4/Umami) — a piece of
  integrations.md not yet separately called out; add as an "Analytics"
  subsection there once this is ported, config'd the same way as the other
  provider integrations (site-level settings, not hardcoded).
- Can serve as the **first pre-built Page templates** a new Site starts
  from (a home page, a blog index/post layout) — i.e. the literal "first
  base pages" use case — once ported to block-tree JSON.

## What we explicitly drop

- **Decap CMS** (`npm run cms`, `decap-server`, Decap's admin UI/config) —
  this project *is* the CMS; Decap is redundant and would be a competing,
  disconnected authoring path. Do not port `decap-server` or any Decap
  config.
- **Flat-file `.mdx` content model** (`content/posts/*.mdx`, `gray-matter`,
  `next-mdx-remote`) — content lives in Postgres as `Page.draftContent`/
  `publishedContent` JSON block trees (data-model.md), not as files on
  disk. Blog posts become regular Pages built from blocks (a "rich text"
  block, per blocks-and-theming.md's block set, covers long-form body
  copy instead of raw MDX).
- Aperture's own auth route (`src/app/api/auth`) — this project has its
  own auth system (auth.md); not applicable.

## Sequencing

Best picked up alongside blocks-and-theming.md's "full block set" work and
integrations.md's SEO/GEO/newsletter items (Phase 3 in roadmap.md) — it's
largely the implementation source for those roadmap items rather than a
separate phase of its own.

## Status

Picked up in two passes. `hero` (composable eyebrow/heading/subheading/CTA
children, full-bleed background, see `components/blocks/registry.tsx`) and
the SEO/GEO/newsletter items shipped independently, ahead of this doc being
revisited. This pass ported the remainder:

- **`gallery` block** (`components/blocks/registry.tsx`) — responsive
  image grid, `images: BlockImage[]` + `columns` prop. Two deliberate
  simplifications from the source's `Gallery.tsx`: **no lightbox** (the
  source's `Lightbox` is a separate component with keyboard nav — dropped
  entirely, images aren't clickable), and captions render as an
  always-visible `<figcaption>` bar under each image rather than a
  hover-reveal overlay (inline styles can't express `:hover`). Column
  collapsing at tablet/mobile reuses the same `columnsResponsiveCss`
  mechanism the `columns`/`list` blocks already use, not the source's own
  breakpoint map.
- **`slider` block** (`components/blocks/registry.tsx` +
  `components/blocks/SliderBlock.tsx`) — `images: BlockImage[]`, a
  controlled `useState` slide index driving `transform: translateX(...)`,
  prev/next buttons as plain "‹"/"›" glyphs (not lucide-react — icon
  libraries stay editor-chrome-only per AGENTS.md) and click-to-jump dots.
  Simplified from the source's native CSS scroll-snap +
  `IntersectionObserver` active-dot-sync: this is index-driven only, no
  scroll-tied state.
- **Shared `images` editor** (`components/editor/BlockImagesEditor.tsx`) —
  add/remove/reorder src+alt+caption rows via the same `MediaPicker` the
  generic image field uses, wired into `Inspector.tsx` for both `gallery`
  and `slider`, following the existing AccordionItemsEditor/
  ContentSwitcherItemsEditor pattern (a dedicated panel, not the generic
  FieldSchema loop, since it's a list of structured records).
- **Analytics adapters** (Plausible/GA4/Umami) — `SiteSettings.analytics`
  (`AnalyticsSettings` in `lib/siteSettings.ts`), injected via
  `components/AnalyticsScripts.tsx` from `PublishedPage.tsx`, configured
  from `SiteSettingsPanel.tsx`'s "Analytics" section. See
  integrations.md's new "Analytics" subsection for the full writeup.
- **Pre-built Page templates** — `homeTemplate`/`blogIndexTemplate`/
  `blogPostTemplate` functions added to the existing `lib/pageTemplates.ts`
  (alongside the already-shipped `landingPageTemplateContent`), each
  generating a fresh `PageContent` with fresh block `id`s. Built from
  `hero`, the new `gallery` block, and existing `heading`/`text`/`list`
  blocks — `blogIndex` uses an unbound `list` block (bind a Collection to
  it after creating one) rather than seeding fake Collection data. Offered
  in the existing "New Page" template picker
  (`components/dashboard/PageList.tsx`) alongside "Blank" and "Landing
  page" — no new picker UI needed, that mechanism already existed.
- **Single action button, not an array** — matches this project's
  existing `button` block's single-link shape on every template above;
  the source's `Hero` actions array isn't reproduced (`hero`'s own props
  never supported multiple actions either, unaffected by this pass).

Dropped, unchanged from "What we explicitly drop" above: Decap CMS, the
flat-file `.mdx` content model, Aperture's own auth route. Not addressed by
this pass: the source's Newsletter provider adapters beyond
storeOnly/webhook (already covered separately by integrations.md's
Newsletter section, not part of this port), and SEO/GEO (shipped
independently, see blocks-and-theming.md/integrations.md).
