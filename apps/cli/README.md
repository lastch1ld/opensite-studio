# opensite CLI

A thin command-line client for OpenSite Studio's public API
(`../../docs/api.md`). Every command is a direct HTTP call — no business
logic lives here, so behavior always matches the dashboard UI (same
`lib/permissions.ts` checks, run server-side).

This package is intentionally standalone: its own `package.json` and
`tsconfig.json`, no root npm workspace. Install and build it independently
of `apps/web`.

## Install

```bash
cd apps/cli
npm install
npm run build
npm link   # optional: makes `opensite` available globally
```

Or run without building, during development:

```bash
npm run dev -- sites list
```

## Configuration

Two environment variables (or the `--api-url` flag):

| Variable            | Required | Description                                         |
| -------------------- | -------- | ---------------------------------------------------- |
| `OPENSITE_API_KEY`   | yes      | An API key created in the dashboard (Site → API keys) |
| `OPENSITE_API_URL`   | yes*     | Base URL of your OpenSite Studio instance, e.g. `https://studio.example.com` |

\* or pass `--api-url <url>` on every command instead.

```bash
export OPENSITE_API_KEY=osk_live_...
export OPENSITE_API_URL=https://studio.example.com
```

An API key is scoped to a single Site (see docs/api.md) — `opensite sites
list` with a key configured returns just that one Site.

## Commands

```bash
opensite sites list

opensite pages list --site <siteId>

opensite pages get <pageId> --site <siteId>
# dumps { draftContent, publishedContent, ... } as JSON

opensite pages publish <pageId> --site <siteId>
# requires a key with the "publish" scope
```

All output is JSON on stdout, suitable for piping into `jq`. Errors print
`Error (<status>): <message>` to stderr and exit non-zero.

## Scopes

Commands fail with a `403` if the configured API key's scopes don't cover
the action — e.g. a `publish`-only key can run `pages publish` but not
`pages list`/`pages get` (those need `read`). See docs/api.md's "Scopes"
section.
