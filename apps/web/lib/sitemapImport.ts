import { safeFetchText } from "./safeFetch";

export type SitemapImportEntry = {
  suggestedSlug: string; // e.g. "about/team" — matches Page.slug's multi-segment form
  suggestedTitle: string; // humanized last segment
  sourceUrl: string; // original (or best-guess) absolute URL, kept for Feature 2 hand-off
  depth: number; // path segment count
  isHome: boolean;
  parentSlug: string | null; // suggestedSlug of the inferred parent, or null if top-level
};

export type SitemapImportResult = {
  entries: SitemapImportEntry[];
  // "crawl" means no sitemap was found/reachable and we fell back to
  // following same-origin links from the root URL — lower-quality, no
  // coverage guarantee (docs/content-import.md).
  source: "sitemap" | "crawl";
};

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractLocUrls(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    urls.push(decodeXmlEntities(match[1].trim()));
  }
  return urls;
}

function humanize(segment: string): string {
  const spaced = segment.replace(/[-_]+/g, " ").trim();
  if (!spaced) return "Untitled";
  return spaced.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function pathOf(absoluteUrl: string, origin: string): string | null {
  try {
    const u = new URL(absoluteUrl, origin);
    if (u.origin !== origin) return null; // only same-origin URLs form the site's page structure
    return u.pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    return null;
  }
}

// Builds the entry list (with synthesized ancestor shells) from a flat list
// of same-origin URLs, per docs/content-import.md's "Page hierarchy" and
// "about/team implies about exists" rules.
function buildEntries(urls: string[], origin: string): SitemapImportEntry[] {
  const pathToSourceUrl = new Map<string, string>();
  for (const absoluteUrl of urls) {
    const path = pathOf(absoluteUrl, origin);
    if (path === null) continue;
    if (!pathToSourceUrl.has(path)) pathToSourceUrl.set(path, absoluteUrl);
  }

  const allPaths = new Set<string>(pathToSourceUrl.keys());
  for (const path of [...allPaths]) {
    const segments = path.split("/").filter(Boolean);
    for (let i = 1; i < segments.length; i++) {
      allPaths.add(segments.slice(0, i).join("/"));
    }
  }
  allPaths.add(""); // root -> home page, always present

  const entries: SitemapImportEntry[] = [];
  for (const path of allPaths) {
    const segments = path.split("/").filter(Boolean);
    const slug = segments.join("/");
    const isHome = path === "";
    entries.push({
      suggestedSlug: slug,
      suggestedTitle: isHome ? "Home" : humanize(segments[segments.length - 1]),
      sourceUrl: pathToSourceUrl.get(path) ?? new URL(`/${slug}`, origin).toString(),
      depth: segments.length,
      isHome,
      parentSlug: segments.length > 1 ? segments.slice(0, -1).join("/") : null,
    });
  }
  entries.sort((a, b) => a.depth - b.depth || a.suggestedSlug.localeCompare(b.suggestedSlug));
  return entries;
}

async function tryFetchSitemap(sitemapUrl: string, origin: string): Promise<SitemapImportEntry[] | null> {
  let xml: string;
  try {
    xml = await safeFetchText(sitemapUrl);
  } catch {
    return null;
  }
  const urls = extractLocUrls(xml);
  if (urls.length === 0) return null;
  return buildEntries(urls, origin);
}

// Same-origin <a href> crawl fallback, bounded so a single import action
// can't turn into an unbounded server-side crawl.
const CRAWL_MAX_PAGES = 40;
const CRAWL_MAX_DEPTH = 2;

async function crawlFromRoot(rootUrl: string, origin: string): Promise<SitemapImportEntry[]> {
  const visited = new Set<string>();
  const queue: { url: string; depth: number }[] = [{ url: rootUrl, depth: 0 }];
  const found: string[] = [];

  while (queue.length > 0 && found.length < CRAWL_MAX_PAGES) {
    const { url, depth } = queue.shift()!;
    const path = pathOf(url, origin);
    if (path === null || visited.has(path)) continue;
    visited.add(path);
    found.push(url);
    if (depth >= CRAWL_MAX_DEPTH) continue;

    let html: string;
    try {
      html = await safeFetchText(url);
    } catch {
      continue;
    }
    const hrefRe = /<a\s[^>]*href\s*=\s*["']([^"'#]+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = hrefRe.exec(html))) {
      let absolute: string;
      try {
        absolute = new URL(match[1], url).toString();
      } catch {
        continue;
      }
      const linkPath = pathOf(absolute, origin);
      if (linkPath === null || visited.has(linkPath)) continue;
      if (found.length + queue.length >= CRAWL_MAX_PAGES) continue;
      queue.push({ url: absolute, depth: depth + 1 });
    }
  }

  return buildEntries(found, origin);
}

export async function importFromSitemapUrl(sitemapUrl: string): Promise<SitemapImportResult> {
  const origin = new URL(sitemapUrl).origin;
  const entries = await tryFetchSitemap(sitemapUrl, origin);
  if (entries) return { entries, source: "sitemap" };
  const crawled = await crawlFromRoot(origin, origin);
  return { entries: crawled, source: "crawl" };
}

export async function importFromRootUrl(rootUrl: string): Promise<SitemapImportResult> {
  const origin = new URL(rootUrl).origin;
  const sitemapEntries = await tryFetchSitemap(new URL("/sitemap.xml", origin).toString(), origin);
  if (sitemapEntries) return { entries: sitemapEntries, source: "sitemap" };
  const crawled = await crawlFromRoot(origin, origin);
  return { entries: crawled, source: "crawl" };
}

// For an uploaded sitemap file there's no URL to derive an origin from, so
// the origin is inferred from the first <loc> entry in the file itself
// (uploaded sitemaps are expected to contain absolute URLs, per the
// sitemap.xml spec).
export function importFromSitemapText(xmlText: string): SitemapImportResult {
  const urls = extractLocUrls(xmlText);
  if (urls.length === 0) return { entries: [], source: "sitemap" };
  const origin = new URL(urls[0]).origin;
  return { entries: buildEntries(urls, origin), source: "sitemap" };
}
