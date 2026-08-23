# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a developer or agency who self-hosts OpenSite Studio and builds/manages
sites on behalf of others — small businesses, clients, or their own
organization's marketing site — then hands day-to-day page editing to a
non-technical site owner (the "EDITOR"/"VIEWER" Membership roles in
auth.md). Secondary: solo indie hackers/hobbyists self-hosting to build
their own site directly. Both personas use the same dashboard/editor; the
self-hoster additionally touches Site Settings, API keys, and the
Theme Builder that a handed-off client editor typically won't.

## Product Purpose

A self-hosted, open-source alternative to Wix/Elementor: sign up, create a
site, edit pages live in a visual block editor, publish, and serve the
result publicly — without a page-reload round trip through a separate site
generator. Success is a non-technical editor being able to build and
publish a real page without touching code, on infrastructure the operator
fully owns (no SaaS lock-in, no per-seat billing, no vendor hosting
requirement).

## Positioning

Unlike Wix/Squarespace/Webflow, this is self-hosted and open-source — the
operator owns the data (Postgres), the deploy (Docker Compose or bare
Node), and can extend it (Plugin/Block SDK, docs/plugin-sdk.md). Unlike a
static-site-generator + headless-CMS split, editing is live: the editor
canvas and the public renderer share one render codepath
(`BlockRenderer`), so what the editor shows while editing is exactly what
publishes, with no build step.

## Operating Context

- Self-hoster installs via Docker Compose (or local Node + Postgres),
  signs up as the first User, creates one or more Sites.
- Day-to-day authoring happens in two surfaces: the **dashboard** (site
  list, pages list, Collections, Theme Builder, Theme, Settings, Members,
  API keys — all fairly dense admin/CRUD screens) and the **editor**
  (canvas + layers panel + inspector + toolbar — a dense, tool-like
  page-builder surface, closer to Figma/Webflow's own chrome than to a
  typical SaaS dashboard).
- A published site is viewed by the site's own end visitors on the public
  web — that surface (the rendered Pages themselves) is a separate design
  concern from the dashboard/editor chrome: its look comes from whatever
  Theme + blocks + starter template the site owner picked, not from
  OpenSite Studio's own product chrome.
- Also reachable programmatically: a CLI, an MCP server, and a public API
  (docs/api.md) for scripted/agent-driven site management — same
  permission model as the UI, not a separate less-guarded path.

## Capabilities and Constraints

- Block-tree content model (`Block { id, type, props, style, children?,
  condition? }`), not HTML strings — this is what makes structural editing
  (select/move/nest) and programmatic access both tractable.
- `BlockRenderer` is the only place block trees become HTML; editor canvas
  and public renderer must never fork into two rendering implementations.
- Roles: OWNER/EDITOR/VIEWER per Site (Membership), enforced server-side.
- Multi-language sites (per-locale Translation overrides), Collections
  (typed datasets + dynamic/repeater pages), Theme Builder (header/footer/
  page templates with conditional targeting), Forms, Popups, custom
  domains + TLS, and a Plugin/Block SDK are all already built (see
  docs/roadmap.md — Phases 0–4 are complete as of this writing).
- Explicitly out of scope for the product: ecommerce (cart/checkout) and
  any analytics/reporting dashboard (docs/roadmap.md).
- Undecided: no confirmed brand name beyond "OpenSite Studio," no logo/mark,
  no committed color identity yet for the product chrome.

## Brand Commitments

Name: "OpenSite Studio." Whitelabeling exists at the instance level
(`APP_NAME`/`APP_LOGO_URL`/`APP_FAVICON_URL`/`APP_PRIMARY_COLOR` env vars,
docs/ai-mode.md) — a self-hoster can already rebrand the dashboard shell
and login/signup pages for their own deployment. No other binding brand
constraints established yet.

## Evidence on Hand

No real customer content, testimonials, or case studies exist — this is
open-source software, not a marketed product with proof assets yet. Do not
fabricate any. The only "content" today is the example plugin's demo block
and whatever a developer creates while testing locally.

## Product Principles

1. Self-hosted-first: every feature must work without a hosted-SaaS
   dependency; whitelabeling and data ownership are load-bearing, not
   cosmetic.
2. One render codepath: editor preview and public output must never
   diverge — this is the trust guarantee the whole product rests on.
3. Hand-off ready: the dashboard/editor must be usable by a non-technical
   EDITOR a developer invites, not just by the technical self-hoster who
   installed it.
4. Extend, don't fork: new capabilities (locales, plugins, programmatic
   access) resolve through one shared mechanism per concern
   (`$token`/`$bind`/`Condition`/`Translation`), never a parallel one-off.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established beyond
standard web accessibility practice (semantic HTML, keyboard operability,
focus management) — apply that as the baseline for both the dashboard/
editor chrome and default page templates; revisit if a self-hoster's
audience needs more.
