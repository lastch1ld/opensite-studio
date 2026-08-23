# OpenSite Studio — Documentation Index

Self-hosted, open-source alternative to Wix/Elementor: a lightweight CMS with
auth, a live visual page editor, and a public site renderer.

**Stack:** Next.js (App Router) + TypeScript, Node.js, Prisma + Postgres,
NextAuth (credentials + OAuth), Docker Compose for self-hosting.

**Working on this repo?** Read [`../AGENTS.md`](../AGENTS.md) first — glossary
of project-specific terms (`$bind`, `Condition`, Template, etc.) and the
ruleset every agent/contributor follows (scope discipline, verification
steps, shared-render-codepath rule, commit policy).

## Status legend
- `[x]` implemented in the current MVP
- `[ ]` documented/designed only — needed for full Wix/Elementor parity, not yet built

## Documents

| Doc | Covers | MVP status |
|---|---|---|
| [architecture.md](architecture.md) | System overview, monorepo layout, request flow | Partial |
| [data-model.md](data-model.md) | Prisma schema: sites, pages, blocks, media, users, revisions | Partial |
| [auth.md](auth.md) | Accounts, roles/permissions, multi-tenant site ownership, sessions | Partial |
| [editor.md](editor.md) | Live drag-and-drop editor, canvas, block registry, undo/redo, autosave | Minimal |
| [editor-ui-stack.md](editor-ui-stack.md) | Editor chrome tooling: Tailwind + Radix primitives, Puck/Craft.js evaluation, lucide-react | Not built |
| [renderer.md](renderer.md) | Public site rendering, custom domains, SSR/ISR, preview vs published | Minimal |
| [blocks-and-theming.md](blocks-and-theming.md) | Block library, design tokens, global styles/theme editor | Not built |
| [media.md](media.md) | Uploads, image transforms, asset library | Not built |
| [integrations.md](integrations.md) | SEO, GEO, social media, newsletter, cookie banner, chatbot embeds | Not built |
| [ai-mode.md](ai-mode.md) | Full-page Claude/ChatGPT-style chat app mode, server-side API keys, whitelabeling | Not built |
| [starter-templates.md](starter-templates.md) | Reusing the `blog-template` (Aperture) repo's blocks/SEO/newsletter as a base, minus Decap CMS | Not built |
| [content-import.md](content-import.md) | One-time migration tooling: sitemap-based page-structure import, and a content clipboard for manually moving old-page text into new blocks | Not built |
| [collections.md](collections.md) | CMS collections, dynamic/repeater pages, conditional visibility, dynamic field binding | Not built |
| [theme-builder.md](theme-builder.md) | Site-wide header/footer/page templates with conditional targeting | Not built |
| [popups-and-modals.md](popups-and-modals.md) | Popup/modal builder with trigger rules | Not built |
| [forms.md](forms.md) | Form builder: fields, conditional logic, multi-step, submissions | Not built |
| [multilingual.md](multilingual.md) | Per-locale translation of pages, templates, and collection fields | Not built |
| [plugins-and-extensibility.md](plugins-and-extensibility.md) | Plugin/app model, third-party block SDK, marketplace | Partial |
| [plugin-sdk.md](plugin-sdk.md) | `registerBlock` API, plugin manifest schema, install flow, trust model (implementation reference for plugins-and-extensibility.md) | Partial |
| [programmatic-access.md](programmatic-access.md) | CLI, MCP server, and public API access with per-key scoped permissions | Not built |
| [deployment.md](deployment.md) | Self-hosting via Docker Compose, env config, backups | Partial |
| [roadmap.md](roadmap.md) | Feature checklist toward full Wix/Elementor parity, phased | N/A |

## Reading order

1. `architecture.md` — get the shape of the system.
2. `data-model.md` + `auth.md` — the persistence and identity foundations everything else depends on.
3. `editor.md` + `renderer.md` — the two user-facing halves (build-time vs serve-time).
   `editor-ui-stack.md` is a narrower follow-on to `editor.md` — read it
   when picking tooling for the editor's own chrome (toolbar/panels/dialogs),
   not the block-rendering system.
4. `blocks-and-theming.md`, `media.md`, `integrations.md`, `ai-mode.md`, `plugins-and-extensibility.md` — parity features layered on top later.
   `starter-templates.md` and `content-import.md` are both "bring in existing content" tools and read well together here too.
5. `collections.md` → `theme-builder.md` → `popups-and-modals.md` / `forms.md` — read in this order: collections.md's `Condition`/`$bind` types are reused by all three of the others.
6. `deployment.md` — how it actually runs self-hosted.
7. `roadmap.md` — what's in the MVP now vs deferred, and in what order to build it next.

## Explicitly out of scope

Ecommerce (product/cart/checkout) and any analytics/reporting dashboard
are deliberately not planned for this project — noted here so they aren't
re-proposed. See roadmap.md.
