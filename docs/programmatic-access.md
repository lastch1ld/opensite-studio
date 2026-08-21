# Programmatic Access: CLI, MCP, and Public API

Not part of Phase 0/1. A cross-cutting requirement rather than a single
feature: everything a user can do through the dashboard/editor UI should
also be reachable **without** the UI — scriptably, from an agent, or from
another system — gated by the same permission model as the UI itself.

## Why this matters here specifically

This project already treats the block tree as structured JSON (not opaque
HTML) and keeps editor/renderer on one shared codepath (architecture.md) —
that structure is exactly what makes programmatic editing tractable rather
than bolted-on. Worth stating explicitly now, before Phase 2+ features
(collections.md, theme-builder.md, forms.md, etc.) get built, so each new
feature's API surface is designed alongside its UI rather than retrofitted.

## Three access surfaces

1. **Public REST/API layer** — the actual foundation; CLI and MCP are both
   thin clients over this. Every mutation the dashboard/editor already
   performs via its internal API routes (`app/api/**`, per the existing
   Phase 0/1 code) should be reachable via a stable, documented, versioned
   API — not necessarily a *different* set of routes, but the existing
   internal routes should be treated as the public contract (or a clean
   subset of them) rather than assumed private just because they're
   same-origin fetches from the dashboard today.
2. **CLI** — a thin command-line client (`opensite sites list`, `opensite
   pages edit <id> --set-block ...`, `opensite publish <pageId>`, etc.)
   over the API layer. Useful for scripting bulk edits, CI-driven content
   updates, and self-hosters who want to manage their instance without
   clicking through the dashboard.
3. **MCP server** — an MCP server exposing this project's entities
   (Sites, Pages, blocks, Collections, Templates, Media, Forms/
   submissions) as tools, so an AI agent (Claude or otherwise) can read
   and edit a site's content directly — e.g. "add a new blog post to my
   site" or "update the pricing on the landing page" as a natural-language
   request instead of manual editor use. This is the most novel of the
   three and the main reason this doc exists: it's a natural fit given the
   project's own architecture, but needs deliberate scoping (see
   Permissions below) since it's a materially more powerful access path
   than a human clicking through a UI one block at a time.

## Authentication & permissions

- **API keys**, not session cookies, for CLI/MCP/API access — generated
  per-user (or per-Membership, once auth.md's Membership roles exist),
  revocable, scoped to a Site (or a set of Sites) rather than globally
  valid for the whole instance.
- **Same role enforcement as the UI** — an API key tied to an EDITOR
  Membership can do what an EDITOR can do in the dashboard, no more; an
  API key should never be a way to bypass `lib/permissions.ts`'s checks,
  it should call through them. This is the core requirement: programmatic
  access is not a separate, less-guarded door into the same house.
- **Scoped/narrower keys** beyond the base role — e.g. a "publish-only"
  key for a CI pipeline that should be able to trigger publishes but not
  edit content, or a "content-only" key for an MCP-driven agent that
  shouldn't be able to change Site settings or billing/danger-zone
  actions. Worth designing as an explicit scope list per key rather than
  all-or-nothing per role, given how much more surface an agent might
  exercise autonomously compared to a human clicking through the UI.
- **Audit trail** — API/CLI/MCP-driven changes should be attributable
  (which key, which user/agent) in the same way UI edits are, once
  auth.md's audit log item exists — more important here than for UI edits
  since these changes may happen unattended.

## Sequencing

Deliberately deferred past the core UI/editor work (Phases 0-3) — the API
surface should be extracted from working, UI-proven functionality rather
than designed speculatively ahead of it. Reasonable ordering once picked
up: (1) formalize/version the existing internal API routes as the public
contract + add API-key auth, (2) CLI as a thin client over that, (3) MCP
server once the API surface is stable enough to expose to an agent
without it constantly changing underneath.
