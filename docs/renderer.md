# Public Renderer

## MVP `[ ]`

- Single catch-all route `app/(public)/[[...slug]]/page.tsx`.
- Host resolution: read the `Host` header → match against `Site.subdomain`
  (`{subdomain}.{APP_DOMAIN}`) or `Site.customDomain` → 404 if no match.
- Path resolution: match remaining slug segments against `Page.slug` for
  that site (`isHome` page serves `/`).
- Render `publishedContent` block tree server-side (RSC) via the shared
  block renderer components (architecture.md). No `publishedContent` yet →
  simple "site not published" placeholder page, not a hard 404.
- Basic `<head>` tags from page/site fields: title, meta description,
  favicon. Full SEO covered separately in integrations.md.

## Needed for full parity `[ ]`

- **Custom domain verification + TLS** — DNS TXT/CNAME verification flow
  backed by `Domain` table (data-model.md), automatic certificate
  provisioning (e.g. via reverse proxy like Caddy/Traefik in
  deployment.md) once verified.
- **ISR/caching** — published pages are cache-friendly (immutable until
  next publish); invalidate the specific page's cache on publish rather
  than rendering fully dynamic on every request.
- **Preview links** — shareable signed URL that renders `draftContent`
  (not `publishedContent`) for stakeholder review before publishing.
- **404 / error page customization** per site.
- **Redirects** — old-slug → new-slug mapping when a page is renamed, plus
  user-defined redirect rules (standard Wix/Elementor site setting).
- **Sitemap.xml / robots.txt** generation per site (ties into SEO in
  integrations.md).
- **Multi-language rendering** — locale-prefixed routing + per-locale
  content variants (Wix Multilingual equivalent). See multilingual.md.
- **Analytics/pageview tracking hook points** for the integrations in
  integrations.md.
