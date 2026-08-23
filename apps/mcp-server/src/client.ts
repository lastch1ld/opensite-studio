// Thin HTTP wrapper over the OpenSite Studio public API (docs/api.md) — same
// role as apps/cli/src/client.ts. Every MCP tool calls one of these
// functions; no Prisma/DB access happens in this package, by design (see
// README.md) — permission checks happen exactly once, server-side, in the
// API this proxies to.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ClientOptions = {
  apiUrl: string;
  apiKey: string;
};

export function resolveOptionsFromEnv(): ClientOptions {
  const apiUrl = process.env.OPENSITE_API_URL;
  const apiKey = process.env.OPENSITE_API_KEY;
  if (!apiUrl) throw new Error("OPENSITE_API_URL is not set (see apps/mcp-server/README.md).");
  if (!apiKey) throw new Error("OPENSITE_API_KEY is not set (see apps/mcp-server/README.md).");
  return { apiUrl: apiUrl.replace(/\/$/, ""), apiKey };
}

async function request<T>(client: ClientOptions, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${client.apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${client.apiKey}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message = (data && typeof data === "object" && "error" in data) ? String((data as { error: unknown }).error) : res.statusText;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export type Site = { id: string; name: string; subdomain: string };
export type Page = {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  isHome: boolean;
  draftContent: unknown;
  publishedContent: unknown;
};
export type Collection = { id: string; siteId: string; name: string; fieldSchema: unknown };
export type CollectionItem = { id: string; collectionId: string; data: unknown };
export type Media = { id: string; siteId: string; url: string; mimeType: string; altText: string | null };

export const api = {
  listSites: (client: ClientOptions) => request<Site[]>(client, "GET", "/api/sites"),

  listPages: (client: ClientOptions, siteId: string) => request<Page[]>(client, "GET", `/api/sites/${siteId}/pages`),

  getPage: (client: ClientOptions, siteId: string, pageId: string) =>
    request<Page>(client, "GET", `/api/sites/${siteId}/pages/${pageId}`),

  updatePage: (
    client: ClientOptions,
    siteId: string,
    pageId: string,
    fields: { draftContent?: unknown; seo?: unknown; isHome?: boolean; collectionId?: string | null },
  ) => request<Page>(client, "PATCH", `/api/sites/${siteId}/pages/${pageId}`, fields),

  publishPage: (client: ClientOptions, siteId: string, pageId: string) =>
    request<Page>(client, "POST", `/api/sites/${siteId}/pages/${pageId}/publish`),

  listCollections: (client: ClientOptions, siteId: string) =>
    request<Collection[]>(client, "GET", `/api/sites/${siteId}/collections`),

  listCollectionItems: (client: ClientOptions, siteId: string, collectionId: string) =>
    request<CollectionItem[]>(client, "GET", `/api/sites/${siteId}/collections/${collectionId}/items`),

  createCollectionItem: (client: ClientOptions, siteId: string, collectionId: string, data: unknown) =>
    request<CollectionItem>(client, "POST", `/api/sites/${siteId}/collections/${collectionId}/items`, { data }),

  updateCollectionItem: (client: ClientOptions, siteId: string, collectionId: string, itemId: string, data: unknown) =>
    request<CollectionItem>(client, "PATCH", `/api/sites/${siteId}/collections/${collectionId}/items/${itemId}`, { data }),

  listMedia: (client: ClientOptions, siteId: string) => request<Media[]>(client, "GET", `/api/sites/${siteId}/media`),
};
