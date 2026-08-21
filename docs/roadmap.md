# Roadmap

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
- AI Mode: full-page Claude/ChatGPT-style chat app, server-side keys, instance whitelabeling (ai-mode.md)
- Plugin/block SDK (plugins-and-extensibility.md)
- Multi-language sites (multilingual.md)
- CLI, MCP server, and public API with per-key scoped permissions (programmatic-access.md)

Phases are a sequencing guide, not a commitment to build every item —
re-prioritize freely as real usage surfaces what matters.

Note: `SiteSettings` gained two new Json columns, `aiCrawlers` and
`chatbotEmbed` (GEO/Chatbots above) — same existing table already noted in
Phase 2, still needs a Prisma migration generated (`npx prisma migrate dev`)
once a dev Postgres is available; schema.prisma is updated and `prisma
generate` succeeds, but no migration file exists yet.

## Explicitly out of scope

Ecommerce (product/cart/checkout, Wix Stores/WooCommerce-equivalent) and
any analytics/reporting dashboard are deliberately not planned for this
project. Decided after researching Wix/Elementor feature parity — call
this out so they aren't re-proposed later.

## Security & architecture audit

Deferred until **all** phases above (0–4) are built out — not run after
each individual phase. Run a security recheck of the codebase and an
architecture audit against docs/architecture.md once the roadmap is
complete, or sooner only if explicitly requested.
