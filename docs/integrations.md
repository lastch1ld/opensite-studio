# SEO / GEO / Social / Newsletter / Cookie Banner / Chatbot Integrations

None of this is in the MVP. Documented up front so the data model and
renderer (data-model.md, renderer.md) leave room for it — e.g. Page/Site
already need a home for meta fields and a script-injection point.

## SEO (Search Engine Optimization) `[ ]`

- Per-page fields: meta title, meta description, canonical URL, OG
  title/description/image, Twitter card type, robots directives
  (index/noindex, follow/nofollow).
- Auto-generated `sitemap.xml` and `robots.txt` per site (renderer.md).
- Structured data (JSON-LD) per block type where relevant (e.g. a "Product"
  or "Article" block emits schema.org markup automatically).
- Slug/URL editing with redirect-on-rename (renderer.md).
- Image alt text enforcement (media.md) since it's both an SEO and
  accessibility requirement.
- Page speed considerations: this is mostly a consequence of the renderer's
  ISR/caching (renderer.md) and image optimization (media.md) rather than
  a separate feature.

## GEO (Generative Engine Optimization) `[ ]`

Newer than classic SEO: optimizing so AI answer engines (ChatGPT, Perplexity,
Google AI Overviews, etc.) can correctly parse, cite, and summarize the
site's content.

- Clean semantic HTML output from the renderer (real `<h1>`-`<h6>`,
  `<article>`, `<nav>` — not div-soup) — a rendering-quality requirement,
  not a separate block.
- Rich structured data (JSON-LD) — same mechanism as classic SEO above, but
  the actual driver for GEO citability.
- An `llms.txt` file per site (emerging convention: a plain-text summary of
  the site aimed at LLM crawlers), generated alongside `sitemap.xml`.
- Explicit crawler access control for known AI bots (GPTBot, PerplexityBot,
  ClaudeBot, etc.) as a robots.txt setting the site owner can toggle,
  rather than a blanket allow/deny.

## Social Media `[ ]`

- Per-page Open Graph / Twitter Card meta (shared plumbing with SEO above).
- Social icon/links block (already listed in blocks-and-theming.md).
- Optional: social feed embed blocks (Instagram/X feed embeds) — treated as
  third-party embed blocks, not bespoke API integrations, to avoid needing
  to manage OAuth against every social platform.
- Share buttons block for published pages.

## Newsletter `[ ]`

- A "Newsletter signup" block (email input + submit) that posts to a
  configurable provider — start with a small set of adapters (e.g.
  Mailchimp, Brevo, a generic webhook/Zapier target) behind one interface
  so adding a provider doesn't touch the block itself.
- Site-level settings page to store the provider API key/list ID
  (encrypted at rest, not just plaintext in `Site` — a general secrets
  handling need shared with any future integration that takes an API key).
- Submissions optionally also logged locally via `FormSubmission`
  (data-model.md) as a fallback/backup even when a provider is configured.

## Cookie Banner `[ ]`

- A site-level "Privacy/Cookie" setting: banner enabled, categories
  (necessary/analytics/marketing), and policy link.
- Renderer injects the consent banner site-wide (not a page block — it's a
  cross-cutting concern, same layer as `<head>` meta tags).
- Consent state gates whether analytics/marketing scripts (below) actually
  load — the banner must control script loading, not just display a
  message, to be meaningfully GDPR-relevant. This is a compliance-adjacent
  feature; ship with sane defaults but do not claim legal compliance
  on the user's behalf without them configuring it.

## Chatbots `[ ]`

- A generic "embed script" mechanism at the site level (paste a snippet /
  select a provider like Intercom, Crisp, Tawk.to) rather than building a
  bespoke chat feature — keeps this a thin integration, not a new product
  surface.
- Injected on public pages only, respecting cookie-banner consent gating
  above if the chosen provider sets cookies.
- A first-party AI chatbot (trained on site content) is a materially larger
  feature (needs its own content-indexing pipeline) — worth a dedicated
  future doc if pursued, not bundled into this generic embed mechanism.

## Analytics `[x]`

docs/starter-templates.md's Aperture port of its Plausible/GA4/Umami
adapters. Site-level settings (`SiteSettings.analytics`,
`AnalyticsSettings` in `lib/siteSettings.ts`), same shared-plumbing store
as every other integration on this page, not hardcoded or a new table:

- One `enabled` flag plus a `provider` select (`none`/`plausible`/`ga4`/
  `umami`) — only the fields the selected provider needs are shown/read
  (Plausible: site domain; GA4: measurement ID; Umami: website ID + script
  URL).
- Injected on public pages only via `components/AnalyticsScripts.tsx`,
  mounted from `PublishedPage.tsx` alongside `ChatbotEmbed`/
  `CookieBanner` — gated by the "analytics" cookie-consent category
  (mirrors `ChatbotEmbed`'s "marketing"-gated pattern exactly), loading
  unconditionally only when the cookie banner itself is off.
- Configured from the dashboard's site Settings page
  (`components/dashboard/SiteSettingsPanel.tsx`'s "Analytics" section),
  same PUT `/api/sites/[siteId]/settings` endpoint as cookie
  banner/newsletter/chatbot settings.

## Shared plumbing this implies

All of the above funnel through two extension points that should exist
even before any specific integration is built:

1. **Site-level settings/secrets store** (SEO defaults, provider API keys,
   cookie categories) — an addition to the `Site` table or a `SiteSettings`
   sibling table in data-model.md.
2. **`<head>`/script injection point** in the renderer (renderer.md) that
   integrations plug into, gated by consent state from the cookie banner.
