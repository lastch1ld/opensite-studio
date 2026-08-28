# Roadmap

**2026-08-23**: `npx prisma migrate dev` was run against a live local
Postgres for the first time (`prisma/migrations/20260823124539_init`),
generating a single initial migration covering the entire schema as it
stood at that point (every table across Phases 0–4). Every individual
"a Prisma migration for the new `X` table still needs to be generated"
note below is now historical — it documents *when* each table was added
to `schema.prisma`, not a still-outstanding migration. Future schema
changes should get their own incremental `prisma migrate dev` migration
as normal, not another such note.

## Phase 0 — MVP (this pass)

Minimal end-to-end slice proving the core loop: sign up → create a site →
edit a page live → publish → view it publicly.

- [x] Repo scaffold: Next.js app, Prisma schema, Docker Compose (deployment.md)
- [x] Auth: credentials login/signup, session, route protection (auth.md)
- [x] Data model: User/Site/Page + NextAuth tables (data-model.md)
- [x] Dashboard: list/create/delete sites and pages
- [x] Block registry with 4 block types: section, text, image, button (blocks-and-theming.md)
- [x] Editor: canvas + layers + inspector + add/select/delete + autosave (editor.md)
- [x] Publish action (draftContent → publishedContent)
- [x] Public renderer: host+slug resolution, render published content (renderer.md)

Explicitly deferred out of Phase 0: drag-and-drop reordering, media
uploads, theming, all of integrations.md, all of
plugins-and-extensibility.md, custom domains, revisions/version history.

## Phase 1 — Usable editor

- [x] Drag-and-drop (add + reorder + reparent)
- [x] Media library + image uploads (media.md)
- [x] Undo/redo
- [x] Responsive breakpoint editing
- [x] More block types (heading, spacer, columns, embed)

Note: a Prisma migration for the new `Media` table still needs to be
generated (`npx prisma migrate dev`) once a dev Postgres is available —
schema.prisma is updated and `prisma generate` succeeds, but no migration
file exists yet.

## Editor UI tooling (editor-ui-stack.md)

Adopt for the editor's own chrome (not the block-rendering system):

- Tailwind + `@radix-ui/react-dialog` for `MediaPicker` and
  `VersionHistoryPanel` (currently hand-rolled modals missing focus trap,
  Escape handling, `aria-modal`)
- `@radix-ui/react-toggle-group` for the breakpoint toggle in `Toolbar.tsx`
- `lucide-react` for toolbar/layers/viewport icons

Puck/Craft.js evaluated and explicitly rejected — both would require
replacing this project's `Block`/`BlockRenderer`/registry/`$bind`/
`Condition` stack wholesale (a rewrite, not an addition) to preserve the
one-shared-render-codepath rule (architecture.md).

## Phase 2 — Real theming + collaboration

- [x] Theme tokens + theme editor panel (blocks-and-theming.md)
- [x] Membership roles (OWNER/EDITOR/VIEWER) + invites (auth.md)
- [x] Revision history + restore (data-model.md)
- [x] Saved/reusable blocks
- [x] Collections + dynamic/repeater pages + conditional visibility + dynamic field binding (collections.md)
- [x] Theme Builder: header/footer/page templates with conditional targeting (theme-builder.md)

Note: Prisma migrations for the new `Theme`, `SavedBlock`, `Membership`,
`Invitation`, `Revision`, `Collection`, `CollectionItem`, and `Template`
tables still need to be generated (`npx prisma migrate dev`) once a dev
Postgres is available — schema.prisma is updated and `prisma generate`
succeeds, but no migration file exists yet (same situation as `Media` in
Phase 1).

Note: a Prisma migration for the new `FormSubmission` table, for the
`Template.trigger` column added for popup trigger/frequency/close-behavior
settings, and for the `Page.parentId` column added for sitemap-import page
hierarchy (content-import.md), still needs to be generated (`npx prisma
migrate dev`) once a dev Postgres is available — schema.prisma is updated
and `prisma generate` succeeds, but no migration file exists yet (same
situation as `Media` in Phase 1).

Note: a Prisma migration for the new `SiteSettings` table (site-level
settings/secrets store shared by the cookie banner and newsletter provider
config) and for the `Page.seo` column added for per-page SEO fields
(integrations.md) still needs to be generated (`npx prisma migrate dev`)
once a dev Postgres is available — schema.prisma is updated and `prisma
generate` succeeds, but no migration file exists yet (same situation as
`Media` in Phase 1).

## Phase 3 — Parity features

- [x] Content import: sitemap-based page-structure import + content clipboard for migrating old-page text (content-import.md)
- [x] Forms: fields, conditional logic, multi-step, submissions (forms.md)
- [x] Popups & modals with trigger rules (popups-and-modals.md)
- [x] SEO fields + sitemap/robots (integrations.md)
- [x] Cookie banner + consent gating (integrations.md)
- [x] Newsletter block + provider adapters (integrations.md)
- [x] Custom domains + TLS (renderer.md, deployment.md)

Phase 3 is now fully complete.

Note: `Site.customDomain` (present in the original data-model.md sketch but
never actually added to schema.prisma until now) plus two new columns,
`customDomainVerified` (Boolean) and `customDomainVerifyToken` (String?),
still need a Prisma migration generated (`npx prisma migrate dev`) once a
dev Postgres is available — schema.prisma is updated and `prisma generate`
succeeds, but no migration file exists yet (same situation as `Media` in
Phase 1). Deliberate simplification: this is the single
`customDomain`+`verified` flag renderer.md/data-model.md flagged as the
simpler option, not the doc's originally-sketched multi-host-per-site
`Domain` table — out of scope for this pass.

## Phase 4 — Ecosystem

- [x] GEO optimizations (llms.txt, AI-crawler controls) (integrations.md)
- [x] Chatbot embed integrations (integrations.md)
- [x] AI Mode: full-page Claude/ChatGPT-style chat app, server-side keys, instance whitelabeling (ai-mode.md)
- [x] Plugin/block SDK (plugins-and-extensibility.md)
- [x] Multi-language sites (multilingual.md)
- [x] CLI, MCP server, and public API with per-key scoped permissions (programmatic-access.md)

Phase 4 is now fully complete — the roadmap has no remaining unchecked items.

Phases are a sequencing guide, not a commitment to build every item —
re-prioritize freely as real usage surfaces what matters.

Note: `SiteSettings` gained two new Json columns, `aiCrawlers` and
`chatbotEmbed` (GEO/Chatbots above) — same existing table already noted in
Phase 2, still needs a Prisma migration generated (`npx prisma migrate dev`)
once a dev Postgres is available; schema.prisma is updated and `prisma
generate` succeeds, but no migration file exists yet.

Note: AI Mode (above) added `Site.mode` (`SiteMode` enum, `BUILDER`
default/`AI_CHAT`), a third `SiteSettings.aiChat` Json column (provider
config + AES-256-GCM-encrypted API key, see lib/secrets.ts), and three new
tables — `SiteVisitor` (per-site visitor accounts, separate from `User`;
see auth.md's deferred "public visitor auth" item, now built minimally),
`AiConversation`, and `AiMessage`. Same as the note above: schema.prisma is
updated and `prisma generate` succeeds, but no migration file exists yet —
still needs `npx prisma migrate dev` once a dev Postgres is available.
Whitelabeling (`AppSettings`) was implemented via env vars
(`APP_NAME`/`APP_LOGO_URL`/`APP_FAVICON_URL`/`APP_PRIMARY_COLOR`, see
lib/appSettings.ts), not a DB row — no migration implication.

Note: Programmatic access (above) added the `ApiKey` table (siteId,
createdByUserId, name, hashedKey, keyPrefix, scopes, createdAt, lastUsedAt,
revokedAt — see docs/api.md and lib/apiAuth.ts). Same as the notes above:
schema.prisma is updated and `prisma generate` succeeds, but no migration
file exists yet — still needs `npx prisma migrate dev` once a dev Postgres
is available.

Note: Multi-language sites (above) added two new tables — `Locale` (id,
siteId, code, label, isDefault, createdAt; a Site's exactly-one-default-Locale
invariant is enforced at the application layer, not a DB constraint, see
lib/locales.ts) and `Translation` (sparse per-locale field overrides keyed by
(localeId, entityType, entityId, blockId, field), see lib/translations.ts) —
plus `Site.defaultLocalePrefixed` (Boolean, default false). Same as the notes
above: schema.prisma is updated and `prisma generate` succeeds, but no
migration file exists yet — still needs `npx prisma migrate dev` once a dev
Postgres is available.

Note: the Plugin/block SDK (above) added no Prisma models — it extracted the
`registerBlock` registration mechanism into `packages/block-sdk`, added
`packages/plugin-api` (manifest validation + a restricted `PluginApiClient`),
and wired a `/plugins`-directory install model (`apps/web/lib/plugins/`,
`apps/web/instrumentation.ts`). See docs/plugin-sdk.md, including its
documented limitation that a plugin's block only renders on the public
(SSR) side without a full rebuild — it can't appear in the client-bundled
editor canvas yet, a Next.js bundling constraint rather than a gap in the
loader itself.

## Starter template port (starter-templates.md)

Not one of the phases above — its own doc, picked up in two passes. `hero`
and the SEO/GEO/newsletter items shipped independently, ahead of this doc
being revisited; this closed the rest:

- [x] `gallery`/`slider` block types ported from Aperture (`../blog-template`)
- [x] Analytics adapters (Plausible/GA4/Umami) as an integrations.md subsection
- [x] home/blogIndex/blogPost Page templates added to the "New Page" template picker

See starter-templates.md's "Status" section for the deliberate simplifications
(no lightbox, no scroll-snap/IntersectionObserver dot-sync, single action
button not an array).

Note: this pass added `SiteSettings.analytics` (`Json?`) — its migration,
`20260828120000_add_site_settings_analytics`, was written by hand on
2026-08-28 (still no dev Postgres) from `prisma migrate diff`'s output
comparing the schema at the last-migrated commit to the current one. That
same diff confirmed `analytics` was the *only* column the migration chain
was missing — every other schema change since `init` is covered.

## Post-roadmap features (2026-08-28)

Built after phases 0–4 closed, from a parity/competitive read of what
hosted builders lead with that this didn't have. Each is deliberately
scoped to what could be built and tested without a database here — see
the note at the end of this section.

- [x] **Accessibility scanner** — `lib/a11y.ts` plus an Accessibility tab
  per site. Audits the block tree (contrast against the resolved
  background, alt text, control names, form labels, heading order) rather
  than rendered HTML, so a finding points at a block someone can fix.
  Elementor's equivalent is a headline feature; this had nothing.
- [x] **Image optimisation on upload** — WebP re-encode capped at 2400px
  via `sharp` (`lib/media.ts`). See [media.md](media.md), including the
  half deliberately not built (responsive `srcset`).
- [x] **Whole-site export** — `lib/siteExport.ts` and an OWNER-only route:
  the content is yours, and the only way out used to be `pg_dump`.
- [x] **Automatic responsive scaling** — type and spacing scale down at
  tablet/mobile unless overridden ([editor.md](editor.md)).
- [x] **AI site generation** — describe the business, get the template's
  copy written for it ([ai-mode.md](ai-mode.md)).

Not built, and worth naming: responsive `srcset`, an **import** to pair
with the export, and an OpenAI adapter for generation (the Anthropic one
is what exists).

**Standing constraint:** this machine has no Docker and no local Postgres,
so nothing in this section — or in Phases B–F of
[site-templates-plan.md](site-templates-plan.md) — has been exercised
against a running app. Everything is covered by unit tests over the pure
logic, and `tsc`/`eslint`/`next build` pass. A pass through the real UI is
the outstanding verification for all of it.

## Explicitly out of scope

Ecommerce (product/cart/checkout, Wix Stores/WooCommerce-equivalent) and
any analytics/reporting dashboard are deliberately not planned for this
project. Decided after researching Wix/Elementor feature parity — call
this out so they aren't re-proposed later.

## Security & architecture audit

Ran 2026-08-28, once phases 0–4 were all complete, as this section
specified. Findings, fixes, and what was deliberately left open are in
[audit-2026-08.md](audit-2026-08.md) — five security findings (all fixed:
a stored-XSS upload path, unauthenticated unbounded disk writes, an
`embed` sandbox that wasn't one, an SSRF in the form webhook, plus a
functional bug it turned up) and an architecture pass that found the
load-bearing invariants intact and two pieces of doc drift.
