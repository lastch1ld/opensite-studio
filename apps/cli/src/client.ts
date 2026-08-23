// Thin HTTP wrapper over the OpenSite Studio public API (docs/api.md). No
// business logic lives here — every command in index.ts just calls one of
// these functions and prints the JSON result.

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

export function resolveOptions(opts: { apiUrl?: string }): ClientOptions {
  const apiUrl = opts.apiUrl ?? process.env.OPENSITE_API_URL;
  const apiKey = process.env.OPENSITE_API_KEY;

  if (!apiUrl) {
    throw new Error("Missing API URL. Pass --api-url or set OPENSITE_API_URL.");
  }
  if (!apiKey) {
    throw new Error("Missing API key. Set OPENSITE_API_KEY (see apps/cli/README.md).");
  }
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

export function listSites(client: ClientOptions) {
  return request<Site[]>(client, "GET", "/api/sites");
}

export function listPages(client: ClientOptions, siteId: string) {
  return request<Page[]>(client, "GET", `/api/sites/${siteId}/pages`);
}

export function getPage(client: ClientOptions, siteId: string, pageId: string) {
  return request<Page>(client, "GET", `/api/sites/${siteId}/pages/${pageId}`);
}

export function publishPage(client: ClientOptions, siteId: string, pageId: string) {
  return request<Page>(client, "POST", `/api/sites/${siteId}/pages/${pageId}/publish`);
}
