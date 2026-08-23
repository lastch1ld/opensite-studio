# opensite-mcp-server

An MCP (Model Context Protocol) server exposing OpenSite Studio's core
entities — Sites, Pages, Collections, Media — as tools for an AI agent
(Claude Desktop, Claude Code, or any other MCP client).

Every tool is a thin proxy over the public API (`../../docs/api.md`) via
`src/client.ts` — this process never talks to Prisma/the database directly.
That's deliberate: it means an agent driving this server is subject to
exactly the same `lib/permissions.ts` role checks (and the API key's
`scopes`) as a human clicking through the dashboard, with no separate,
less-guarded path into the data.

This package is intentionally standalone: its own `package.json` and
`tsconfig.json`, no root npm workspace.

## Install & build

```bash
cd apps/mcp-server
npm install
npm run build
```

## Configuration

Two environment variables, same as the CLI (`apps/cli`):

| Variable            | Required | Description                                         |
| -------------------- | -------- | ---------------------------------------------------- |
| `OPENSITE_API_KEY`   | yes      | An API key created in the dashboard (Site → API keys) |
| `OPENSITE_API_URL`   | yes      | Base URL of your OpenSite Studio instance             |

An API key is scoped to a single Site (docs/api.md) — this server (and the
agent using it) only ever sees that one Site's data. Give the key only the
scopes the agent actually needs (e.g. `read` + `write` but not `publish`,
if you don't want an agent auto-publishing).

## Using with Claude Desktop / Claude Code

Add to your MCP client's config (Claude Desktop's `claude_desktop_config.json`,
or Claude Code's `.mcp.json`):

```json
{
  "mcpServers": {
    "opensite": {
      "command": "node",
      "args": ["/absolute/path/to/apps/mcp-server/dist/index.js"],
      "env": {
        "OPENSITE_API_KEY": "osk_live_...",
        "OPENSITE_API_URL": "https://studio.example.com"
      }
    }
  }
}
```

Restart the client after adding this. The server communicates over stdio.

## Tools

| Tool                      | Scope required | Description                                                        |
| -------------------------- | --------------- | -------------------------------------------------------------------- |
| `list_sites`               | `read`          | List sites accessible to the key (one Site, for a key)              |
| `list_pages`                | `read`          | List a Site's pages                                                 |
| `get_page`                  | `read`          | Fetch one page's draft/published block-tree content                 |
| `update_page`               | `write`         | Replace a page's draft block tree and/or metadata                   |
| `publish_page`              | `publish`       | Copy draft → published content (goes live)                          |
| `list_collections`          | `read`          | List a Site's Collections and their items                           |
| `list_collection_items`     | `read`          | List items in one Collection                                        |
| `create_collection_item`    | `write`         | Add a new item to a Collection                                      |
| `update_collection_item`    | `write`         | Replace an existing item's data                                     |
| `list_media`                | `read`          | List a Site's media library                                         |

`update_page`/`update_collection_item` replace content wholesale (same as
the underlying `PATCH` routes) — call the corresponding `get`/`list` tool
first if the agent needs to edit rather than overwrite.

A tool call that the configured API key's scopes don't cover returns an
MCP error result (`isError: true`) with the underlying `403` message,
rather than throwing — the agent sees why and can ask for a broader key.

## Manual smoke test

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0"}}}' \
  | OPENSITE_API_KEY=... OPENSITE_API_URL=... node dist/index.js
```

Should print an `initialize` result on stdout and
`opensite-mcp-server running on stdio` on stderr.
