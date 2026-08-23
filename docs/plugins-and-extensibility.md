# Plugins & Extensibility

Originally documented ahead of the MVP so the architecture didn't
accidentally foreclose it. Now implemented — see
**[plugin-sdk.md](plugin-sdk.md)** for the actual API surface, manifest
schema, install flow, and trust model. This doc stays as the original
design sketch/rationale; plugin-sdk.md is the reference to build against.

## Needed for full parity

- [x] **Block SDK** — a stable, documented interface (`registerBlock({ type,
  render, inspector, defaultProps })`) that third-party code can call,
  extracted from `apps/web/components/blocks` into `packages/block-sdk`.
  See plugin-sdk.md.
- [x] **Plugin manifest + install model** — a plugin bundles one or more
  blocks plus metadata (name, version, permissions it needs — e.g.
  `"reads:siteSettings"`, `"adds:apiRoute"`). Self-hosted install is
  "drop a package in `/plugins` + restart", not a hosted marketplace.
  See plugin-sdk.md. (Integration-bundling plugins — integrations.md —
  aren't built; today's plugins register blocks only.)
- [x] **Sandboxing/permission model** — pragmatic scope, not full
  sandboxing: manifest validation refuses to load a malformed plugin, and
  plugins get a restricted `PluginApiClient` (`packages/plugin-api`)
  instead of the raw Prisma client. Full V8-isolate-style sandboxing of
  third-party Node code remains explicitly out of scope — see
  plugin-sdk.md's "Sandboxing / trust model" for exactly what is and
  isn't actually enforced.
- [ ] **Marketplace/discovery** — still optional, only relevant if/when
  there's a registry of community plugins; out of scope for a
  self-hosted-first tool unless the community actually wants it.
- [x] **Custom code block / embed** — the lightweight version of
  extensibility (raw HTML/JS block) shipped ahead of the plugin system as
  planned — see the `embed` block type in blocks-and-theming.md /
  `components/blocks/registry.tsx`.
