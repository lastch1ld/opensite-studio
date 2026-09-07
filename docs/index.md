# OpenSite Studio — Documentation Index

Self-hosted, open-source alternative to Wix/Elementor: a lightweight CMS with
auth, a live visual page editor, and a public site renderer.

**Stack:** Next.js (App Router) + TypeScript, Node.js, Prisma + Postgres,
NextAuth (credentials + OAuth), Docker Compose for self-hosting.

**Working on this repo?** Read [`../AGENTS.md`](../AGENTS.md) first — glossary
of project-specific terms (`$bind`, `Condition`, Template, etc.) and the
ruleset every agent/contributor follows (scope discipline, verification
steps, shared-render-codepath rule, commit policy).

## Documents

Everything below is built. Where a doc still describes something that
isn't, it says so in place — see [roadmap.md](roadmap.md) for the
consolidated list of what's left.

| Doc | Covers |
|---|---|
| [architecture.md](architecture.md) | System overview, monorepo layout, request flow |
| [data-model.md](data-model.md) | Prisma schema: sites, pages, blocks, media, users, revisions |
| [auth.md](auth.md) | Accounts, roles/permissions, multi-tenant site ownership, sessions |
| [editor.md](editor.md) | Live drag-and-drop editor, canvas, block registry, undo/redo, autosave, responsive scaling |
| [editor-ui-stack.md](editor-ui-stack.md) | Editor chrome tooling: Tailwind + Radix primitives, Puck/Craft.js evaluation, lucide-react |
| [renderer.md](renderer.md) | Public site rendering, custom domains, SSR/ISR, preview vs published |
| [blocks-and-theming.md](blocks-and-theming.md) | Block library, design tokens, global styles/theme editor |
| [media.md](media.md) | Uploads, WebP optimisation, asset library — plus the `srcset` half not built |
| [integrations.md](integrations.md) | SEO, GEO, social media, newsletter, analytics, cookie banner, chatbot embeds |
| [ai-mode.md](ai-mode.md) | Full-page chat app mode, server-side API keys, whitelabeling, AI site generation |
| [starter-templates.md](starter-templates.md) | The Aperture port: single-page starters, gallery/slider blocks |
| [site-templates-plan.md](site-templates-plan.md) | The six full multi-page genre templates, and the bar they're held to |
| [content-import.md](content-import.md) | Sitemap-based page-structure import, content clipboard for old-page text |
| [collections.md](collections.md) | CMS collections, dynamic/repeater pages, conditional visibility, `$bind` |
| [theme-builder.md](theme-builder.md) | Site-wide header/footer/page templates with conditional targeting |
| [popups-and-modals.md](popups-and-modals.md) | Popup/modal builder with trigger rules |
| [forms.md](forms.md) | Form builder: fields, conditional logic, multi-step, submissions |
| [multilingual.md](multilingual.md) | Per-locale translation of pages, templates, and collection fields |
| [plugins-and-extensibility.md](plugins-and-extensibility.md) | Plugin/app model, third-party block SDK, marketplace |
| [plugin-sdk.md](plugin-sdk.md) | `registerBlock` API, plugin manifest, install flow, trust model |
| [programmatic-access.md](programmatic-access.md) | CLI, MCP server, and public API with per-key scoped permissions |
| [api.md](api.md) | The public REST API surface and its scoped key auth |
| [deployment.md](deployment.md) | Self-hosting via Docker Compose, env config, backups |
| [reference-sites-research.md](reference-sites-research.md) | The real sites the block library and templates were designed against |
| [reference-sites-plan.md](reference-sites-plan.md) | How that research turned into block types |
| [audit-2026-08.md](audit-2026-08.md) | Security & architecture audit: findings, fixes, what's still open |
| [roadmap.md](roadmap.md) | What's built, what isn't, and the durable scope decisions |
| [ui-ux-roadmap.md](ui-ux-roadmap.md) | The live roadmap: product-chrome design work still outstanding |

## Reading order

1. `architecture.md` — get the shape of the system.
2. `data-model.md` + `auth.md` — the persistence and identity foundations everything else depends on.
3. `editor.md` + `renderer.md` — the two user-facing halves (build-time vs serve-time).
   `editor-ui-stack.md` is a narrower follow-on to `editor.md` — read it
   when picking tooling for the editor's own chrome (toolbar/panels/dialogs),
   not the block-rendering system.
4. `blocks-and-theming.md`, `media.md`, `integrations.md`, `ai-mode.md`, `plugins-and-extensibility.md` — parity features layered on top.
   `starter-templates.md` and `content-import.md` are both "bring in existing content" tools and read well together here too.
5. `collections.md` → `theme-builder.md` → `popups-and-modals.md` / `forms.md` — read in this order: collections.md's `Condition`/`$bind` types are reused by all three of the others.
6. `deployment.md` — how it actually runs self-hosted.
7. `roadmap.md` + `ui-ux-roadmap.md` — what's built, and what's next.

## Explicitly out of scope

Ecommerce (product/cart/checkout) and any analytics/reporting dashboard
are deliberately not planned for this project — noted here so they aren't
re-proposed. See roadmap.md.
