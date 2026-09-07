# Roadmap

The phased roadmap (Phases 0–4) is complete, so this doc is no longer a
plan — it's the record of what got built, and the short list of what
hasn't. Each capability is documented in its own file; this page only says
that it exists and where to read about it.

## What's built

**The core loop** — sign up, create a site, edit a page live, publish,
serve it publicly. Credentials auth ([auth.md](auth.md)), the
`User`/`Site`/`Page` model ([data-model.md](data-model.md)), the block
registry and editor ([editor.md](editor.md),
[blocks-and-theming.md](blocks-and-theming.md)), and the public renderer
([renderer.md](renderer.md)), which reads `publishedContent` only.

**A usable editor** — drag-and-drop add/reorder/reparent, undo/redo,
media library and uploads ([media.md](media.md)), responsive breakpoint
editing with automatic down-scaling, and the full block set.

**Theming and collaboration** — theme tokens and editor, four starting
presets, membership roles and invites, revision history with restore,
saved/reusable blocks, Collections with dynamic pages and `$bind`
([collections.md](collections.md)), and the Theme Builder's
header/footer/page templates with conditional targeting
([theme-builder.md](theme-builder.md)).

**Parity features** — sitemap-based content import
([content-import.md](content-import.md)), the form builder
([forms.md](forms.md)), popups ([popups-and-modals.md](popups-and-modals.md)),
SEO fields with sitemap/robots, cookie banner and consent gating,
newsletter adapters, analytics adapters
([integrations.md](integrations.md)), and custom domains with on-demand
TLS ([deployment.md](deployment.md)).

Custom domains took the simpler of the two shapes data-model.md sketched:
one `customDomain` per site plus a `customDomainVerified` flag and a TXT
verification token, not a multi-host `Domain` table.

**Ecosystem** — GEO controls and `llms.txt`, chatbot embeds, AI Mode's
full-page chat app with server-side keys ([ai-mode.md](ai-mode.md)), the
plugin and block SDK ([plugin-sdk.md](plugin-sdk.md)), multi-language
sites ([multilingual.md](multilingual.md)), and the CLI/MCP/public API
with scoped keys ([programmatic-access.md](programmatic-access.md)).
Instance whitelabeling is env vars (`APP_NAME`, `APP_LOGO_URL`,
`APP_FAVICON_URL`, `APP_PRIMARY_COLOR` — see `lib/appSettings.ts`), not a
database row.

**Site templates** — six complete multi-genre templates
([site-templates-plan.md](site-templates-plan.md)) and the single-page
starters ported from Aperture ([starter-templates.md](starter-templates.md)).

**Post-roadmap additions (2026-08-28)**, from a read of what hosted
builders lead with that this didn't have:

- An **accessibility scanner** (`lib/a11y.ts`, plus an Accessibility tab
  per site) that audits the block tree — contrast against the resolved
  background, alt text, control names, form labels, heading order — so a
  finding points at a block someone can go and fix.
- **Image optimisation on upload**: WebP re-encode capped at 2400px, see
  [media.md](media.md).
- **Whole-site export** (`lib/siteExport.ts`), because the only way to get
  content out used to be `pg_dump`.
- **Automatic responsive scaling** of type and spacing, see
  [editor.md](editor.md).
- **AI site generation** — describe the business, get the template's copy
  written for it, see [ai-mode.md](ai-mode.md).

## What isn't built

- **Live verification of everything above.** This machine has no Docker
  and no local Postgres, so nothing has been exercised against a running
  app. The pure logic is covered by unit tests (`apps/web/tests/`) and
  `tsc`/`eslint`/`next build` pass, but a pass through the real UI is
  outstanding — most visibly for the six site templates, whose own plan
  doc still calls them unverified.
- **Product chrome design work.** [ui-ux-roadmap.md](ui-ux-roadmap.md) is
  the live roadmap now; its Phase B is done and Phase A is partly done.
- **Responsive `srcset`**, the half of image optimisation deliberately
  left out ([media.md](media.md)).
- **A site import** to pair with the export.
- **An OpenAI adapter** for chat and generation. Only Anthropic exists;
  `AiChatSettings.provider` already models the choice.
- Three security items the audit left open — see below.

## Schema migrations

`prisma/migrations/` holds the real chain: `init` (every table as of
2026-08-23), plus one migration per change since. Future schema changes
get their own incremental migration as normal.

Without a dev Postgres, `prisma migrate dev` can't run — but
`prisma migrate diff` doesn't need a database, and is how the current
chain was verified and how its last migration was written:

```
npx prisma migrate diff \
  --from-schema-datamodel <schema.prisma at the last migrated commit> \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

Write the resulting SQL as a migration rather than leaving a note saying
one is needed. CI additionally applies the chain to a real Postgres and
fails on drift, which is what caught the one column that had slipped
through (`SiteSettings.analytics`).

## Explicitly out of scope

Ecommerce (product/cart/checkout, Wix Stores/WooCommerce-equivalent) and
any analytics/reporting dashboard are deliberately not planned for this
project. Decided after researching Wix/Elementor feature parity — called
out here so they aren't re-proposed later.

## Security & architecture audit

Ran 2026-08-28, once the phases were complete. Five security findings, all
fixed — a stored-XSS upload path, unauthenticated unbounded disk writes,
an `embed` sandbox that wasn't one, an SSRF in the form webhook, plus a
functional bug it turned up — and an architecture pass that found the
load-bearing invariants intact. Findings, fixes, and the three items
deliberately left open are in [audit-2026-08.md](audit-2026-08.md).
