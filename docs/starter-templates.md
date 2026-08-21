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
