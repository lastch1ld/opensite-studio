import { headers } from "next/headers";
import { siteFromHost } from "@/lib/resolveSite";
import { db } from "@/lib/db";
import { isPageIndexable, type PageSeo } from "@/lib/seo";

// Auto-generated per-site sitemap (docs/integrations.md "Auto-generated
// sitemap.xml and robots.txt per site") — one shared route for every site,
// scoped by the same Host-header resolution the public page route already
// uses, listing only published pages and respecting per-page noindex.
export async function GET(req: Request) {
  const host = (await headers()).get("host");
  const site = await siteFromHost(host);
  if (!site) return new Response("Not found", { status: 404 });

  const pages = await db.page.findMany({ where: { siteId: site.id } });

  const origin = new URL(req.url).origin;
  const urls = pages
    .filter((p) => p.publishedContent !== null && isPageIndexable(p.seo as PageSeo | null))
    .map((p) => {
      const path = p.isHome ? "" : `/${p.slug}`;
      return `<url><loc>${origin}${path}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
