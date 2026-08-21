import { lookup } from "dns/promises";

// Basic SSRF-adjacent guards for server-side fetches of user-supplied URLs
// (sitemap import, root-URL crawl, content clipboard). Not a full SSRF
// defense system (see docs/content-import.md's scope) — deliberately just:
// http(s)-only, block loopback/private/link-local targets (checked both by
// hostname literal and by resolved DNS address, and re-checked on every
// redirect hop so a public host can't 302 into an internal one), a request
// timeout, and a response-size cap.

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;

function isPrivateIPv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized.startsWith("fe80:")) return true; // link-local
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local (fc00::/7)
  if (normalized.startsWith("::ffff:")) return isPrivateIPv4(normalized.slice("::ffff:".length));
  return false;
}

async function assertHostAllowed(hostname: string): Promise<void> {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".local")) {
    throw new Error("This URL's host is not allowed.");
  }
  if (isPrivateIPv4(lower) || isPrivateIPv6(lower)) {
    throw new Error("This URL's host is not allowed.");
  }
  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new Error("Could not resolve this URL's host.");
  }
  for (const { address } of addresses) {
    if (isPrivateIPv4(address) || isPrivateIPv6(address)) {
      throw new Error("This URL resolves to a private/internal address.");
    }
  }
}

// Fetches text content from a user-supplied URL with SSRF guards, a
// timeout, and a size cap. Follows redirects manually (up to
// MAX_REDIRECTS) so each hop is re-validated.
export async function safeFetchText(rawUrl: string): Promise<string> {
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = new URL(current);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Only http(s) URLs are supported.");
    }
    await assertHostAllowed(url.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal, redirect: "manual" });
    } catch {
      throw new Error("Failed to fetch this URL.");
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Redirect response had no location.");
      current = new URL(location, url).toString();
      continue;
    }

    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}.`);

    const contentLength = res.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      throw new Error("Response is too large.");
    }

    const reader = res.body?.getReader();
    if (!reader) return "";
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => {});
        throw new Error("Response is too large.");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
  }
  throw new Error("Too many redirects.");
}
