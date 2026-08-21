# Plugins & Extensibility

Not part of the MVP at all — documented so the architecture doesn't
accidentally foreclose it later.

## Needed for full parity `[ ]`

- **Block SDK** — a stable, documented interface (`registerBlock({ type,
  render, inspector, defaultProps })`) that third-party code can call,
  extracted from `apps/web/components/blocks` into a `packages/block-sdk`
  once it needs to be consumed outside the main app.
- **Plugin manifest + install model** — a plugin bundles one or more
  blocks/integrations (integrations.md) plus metadata (name, version,
  permissions it needs — e.g. "reads Site settings", "adds a Page API
  route"). Self-hosted install would likely be "drop a package in
  `/plugins` + restart" rather than a hosted marketplace, given this is a
  self-hosted OSS project, not a SaaS.
- **Sandboxing/permission model** — a plugin's server-side code running
  inside the same Node process as auth/DB access is a real risk once
  third-party plugins are allowed; needs explicit scoping (e.g. plugins get
  a restricted API client, not a raw Prisma client) before this is safe to
  open up.
- **Marketplace/discovery** — optional, only relevant if/when there's a
  registry of community plugins; out of scope for a self-hosted-first tool
  unless the community actually wants it.
- **Custom code block / embed** — the lightweight version of extensibility
  (raw HTML/JS block, already listed in blocks-and-theming.md) covers many
  "I just need one custom thing" cases without needing the full plugin
  system, and should ship well before this does.
