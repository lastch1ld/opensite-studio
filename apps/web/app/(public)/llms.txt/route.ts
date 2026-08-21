import { headers } from "next/headers";
import { siteFromHost } from "@/lib/resolveSite";
import { db } from "@/lib/db";
import { isPageIndexable, type PageSeo } from "@/lib/seo";

// Per-site llms.txt (docs/integrations.md "GEO" — "a plain-text summary of
// the site aimed at LLM crawlers, generated alongside sitemap.xml"). Same
// host-resolution + published/indexable filtering as sitemap.xml, but
// rendered as the emerging llms.txt markdown convention (H1 site name, one
// link+description bullet per page) instead of an XML url list.
export async function GET(req: Request) {
  const host = (await headers()).get("host");
  const site = await siteFromHost(host);
  if (!site) return new Response("Not found", { status: 404 });

  const pages = await db.page.findMany({ where: { siteId: site.id } });
  const origin = new URL(req.url).origin;

  const lines = pages
    .filter((p) => p.publishedContent !== null && isPageIndexable(p.seo as PageSeo | null))
    .map((p) => {
      const seo = (p.seo as PageSeo | null) ?? {};
      const path = p.isHome ? "" : `/${p.slug}`;
      const title = seo.metaTitle || p.title;
      const description = seo.metaDescription;
      return description ? `- [${title}](${origin}${path}): ${description}` : `- [${title}](${origin}${path})`;
    });

  const body = `# ${site.name}\n\n${lines.join("\n")}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
