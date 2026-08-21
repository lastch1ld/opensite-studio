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

## Phase 2 — Real theming + collaboration

- [x] Theme tokens + theme editor panel (blocks-and-theming.md)
- [x] Membership roles (OWNER/EDITOR/VIEWER) + invites (auth.md)
- [x] Revision history + restore (data-model.md)
- [x] Saved/reusable blocks
- Collections + dynamic/repeater pages + conditional visibility + dynamic field binding (collections.md)
- Theme Builder: header/footer/page templates with conditional targeting (theme-builder.md)

Note: Prisma migrations for the new `Theme`, `SavedBlock`, `Membership`,
`Invitation`, and `Revision` tables still need to be generated
(`npx prisma migrate dev`) once a dev Postgres is available — schema.prisma
is updated and `prisma generate` succeeds, but no migration file exists yet
(same situation as `Media` in Phase 1).

## Phase 3 — Parity features

- Content import: sitemap-based page-structure import + content clipboard for migrating old-page text (content-import.md)
- Forms: fields, conditional logic, multi-step, submissions (forms.md)
- Popups & modals with trigger rules (popups-and-modals.md)
- SEO fields + sitemap/robots (integrations.md)
- Cookie banner + consent gating (integrations.md)
- Newsletter block + provider adapters (integrations.md)
- Custom domains + TLS (renderer.md, deployment.md)

## Phase 4 — Ecosystem

- GEO optimizations (llms.txt, AI-crawler controls) (integrations.md)
- Chatbot embed integrations (integrations.md)
- AI Mode: full-page Claude/ChatGPT-style chat app, server-side keys, instance whitelabeling (ai-mode.md)
- Plugin/block SDK (plugins-and-extensibility.md)
- Multi-language sites (multilingual.md)
- CLI, MCP server, and public API with per-key scoped permissions (programmatic-access.md)

Phases are a sequencing guide, not a commitment to build every item —
re-prioritize freely as real usage surfaces what matters.

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
