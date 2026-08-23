#!/usr/bin/env node
// MCP server for OpenSite Studio (docs/programmatic-access.md, surface 3).
// Every tool below is a thin proxy over the public API (docs/api.md) via
// src/client.ts — this process never touches Prisma/the database directly,
// so the exact same permission checks (lib/permissions.ts, run server-side
// in the API) apply to an agent driving this server as apply to a human in
// the dashboard or a script using the CLI.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { api, ApiError, resolveOptionsFromEnv, type ClientOptions } from "./client.js";

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(error: unknown) {
  const message =
    error instanceof ApiError
      ? `API error (${error.status}): ${error.message}`
      : error instanceof Error
        ? error.message
        : String(error);
  return { content: [{ type: "text" as const, text: message }], isError: true as const };
}

/** Wraps a tool handler so any thrown ApiError/Error becomes an MCP error result instead of crashing the server. */
function withErrorHandling<Args>(fn: (client: ClientOptions, args: Args) => Promise<unknown>) {
  return async (args: Args) => {
    try {
      const client = resolveOptionsFromEnv();
      const data = await fn(client, args);
      return textResult(data);
    } catch (error) {
      return errorResult(error);
    }
  };
}

const server = new McpServer({ name: "opensite-mcp-server", version: "0.1.0" });

server.registerTool(
  "list_sites",
  {
    title: "List sites",
    description:
      "List the sites accessible to the configured API key. A key is scoped to a single Site, so this " +
      "returns exactly one Site when authenticated with an API key. Returns each site's id, name, and subdomain.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  withErrorHandling(async (client) => api.listSites(client)),
);

const siteIdField = z.string().describe("The Site id (from list_sites).");
const pageIdField = z.string().describe("The Page id (from list_pages or get_page).");
const collectionIdField = z.string().describe("The Collection id (from list_collections).");

server.registerTool(
  "list_pages",
  {
    title: "List pages",
    description:
      "List all pages for a Site, including each page's id, title, slug, isHome flag, and whether it's a " +
      "dynamic/collection-bound page. Use get_page for a single page's full draft/published block-tree content.",
    inputSchema: { site_id: siteIdField },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  withErrorHandling(async (client, { site_id }: { site_id: string }) => api.listPages(client, site_id)),
);

server.registerTool(
  "get_page",
  {
    title: "Get page",
    description:
      "Fetch a single page's full content: draftContent and publishedContent are each a block tree " +
      "({ root: Block, version }) where a Block is { id, type, props, style, children?, condition? }. " +
      "draftContent is what the editor currently holds; publishedContent is what's live on the public site " +
      "until the next publish_page call.",
    inputSchema: { site_id: siteIdField, page_id: pageIdField },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  withErrorHandling(async (client, { site_id, page_id }: { site_id: string; page_id: string }) =>
    api.getPage(client, site_id, page_id),
  ),
);

server.registerTool(
  "update_page",
  {
    title: "Update page",
    description:
      "Update a page's draft block tree and/or metadata. This edits the DRAFT only — it does not affect the " +
      "live published site until publish_page is called. draft_content, if provided, must be a full " +
      "{ root: Block, version } object (replacing the current draft wholesale, same as the editor's autosave); " +
      "fetch the current value with get_page first if you need to edit rather than replace it. Requires an API " +
      "key with the 'write' scope.",
    inputSchema: {
      site_id: siteIdField,
      page_id: pageIdField,
      draft_content: z.unknown().optional().describe("Full { root: Block, version } page content to replace the draft with."),
      is_home: z.boolean().optional().describe("Set this page as the site's home page."),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  withErrorHandling(
    async (
      client,
      { site_id, page_id, draft_content, is_home }: { site_id: string; page_id: string; draft_content?: unknown; is_home?: boolean },
    ) => api.updatePage(client, site_id, page_id, { draftContent: draft_content, isHome: is_home }),
  ),
);

server.registerTool(
  "publish_page",
  {
    title: "Publish page",
    description:
      "Publish a page: copies its current draftContent to publishedContent (what the public site serves) and " +
      "snapshots a Revision. Requires an API key with the 'publish' scope and an OWNER-capped role — same rule " +
      "as the dashboard's Publish button.",
    inputSchema: { site_id: siteIdField, page_id: pageIdField },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  withErrorHandling(async (client, { site_id, page_id }: { site_id: string; page_id: string }) =>
    api.publishPage(client, site_id, page_id),
  ),
);

server.registerTool(
  "list_collections",
  {
    title: "List collections",
    description:
      "List a Site's Collections (user-defined typed datasets, e.g. 'Blog Posts' or 'Products'), including " +
      "each collection's fieldSchema and its items.",
    inputSchema: { site_id: siteIdField },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  withErrorHandling(async (client, { site_id }: { site_id: string }) => api.listCollections(client, site_id)),
);

server.registerTool(
  "list_collection_items",
  {
    title: "List collection items",
    description: "List all items (rows) in a Collection. Each item's `data` matches the collection's fieldSchema.",
    inputSchema: { site_id: siteIdField, collection_id: collectionIdField },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  withErrorHandling(async (client, { site_id, collection_id }: { site_id: string; collection_id: string }) =>
    api.listCollectionItems(client, site_id, collection_id),
  ),
);

server.registerTool(
  "create_collection_item",
  {
    title: "Create collection item",
    description:
      "Create a new item (row) in a Collection. `data` should be an object matching the collection's " +
      "fieldSchema (see list_collections). Requires an API key with the 'write' scope.",
    inputSchema: {
      site_id: siteIdField,
      collection_id: collectionIdField,
      data: z.record(z.string(), z.unknown()).describe("Field values matching the collection's fieldSchema."),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  withErrorHandling(
    async (client, { site_id, collection_id, data }: { site_id: string; collection_id: string; data: Record<string, unknown> }) =>
      api.createCollectionItem(client, site_id, collection_id, data),
  ),
);

server.registerTool(
  "update_collection_item",
  {
    title: "Update collection item",
    description:
      "Replace an existing collection item's `data`. This replaces the whole `data` object, not a partial " +
      "merge — fetch the current value with list_collection_items first if you need to change only some " +
      "fields. Requires an API key with the 'write' scope.",
    inputSchema: {
      site_id: siteIdField,
      collection_id: collectionIdField,
      item_id: z.string().describe("The CollectionItem id (from list_collection_items)."),
      data: z.record(z.string(), z.unknown()).describe("Full replacement field values matching the collection's fieldSchema."),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  withErrorHandling(
    async (
      client,
      { site_id, collection_id, item_id, data }: { site_id: string; collection_id: string; item_id: string; data: Record<string, unknown> },
    ) => api.updateCollectionItem(client, site_id, collection_id, item_id, data),
  ),
);

server.registerTool(
  "list_media",
  {
    title: "List media",
    description: "List a Site's uploaded media library assets (images etc.): id, url, mimeType, altText.",
    inputSchema: { site_id: siteIdField },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  withErrorHandling(async (client, { site_id }: { site_id: string }) => api.listMedia(client, site_id)),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("opensite-mcp-server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error running opensite-mcp-server:", error);
  process.exit(1);
});
