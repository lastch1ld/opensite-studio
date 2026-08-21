import { headers } from "next/headers";
import { subdomainFromHost } from "@/lib/resolveSite";
import { db } from "@/lib/db";

// Per-site robots.txt (docs/integrations.md), pointing crawlers at this
// site's own sitemap.xml. Global disallow rules aren't a per-page setting
// (Page-level index/follow directives are handled per-page in
// generateMetadata / sitemap.xml instead), so this stays a fixed template.
export async function GET(req: Request) {
  const host = (await headers()).get("host");
  const subdomain = subdomainFromHost(host);
  if (!subdomain) return new Response("User-agent: *\nDisallow: /", { headers: { "Content-Type": "text/plain" } });

  const site = await db.site.findUnique({ where: { subdomain } });
  if (!site) return new Response("User-agent: *\nDisallow: /", { headers: { "Content-Type": "text/plain" } });

  const origin = new URL(req.url).origin;
  const body = `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
