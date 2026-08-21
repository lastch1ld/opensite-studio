import { headers } from "next/headers";
import { siteFromHost } from "@/lib/resolveSite";
import { KNOWN_AI_CRAWLERS, defaultAiCrawlerSettings, type AiCrawlerSettings } from "@/lib/siteSettings";

// AI-crawler-specific User-agent blocks (docs/integrations.md "GEO" —
// "Explicit crawler access control for known AI bots ... rather than a
// blanket allow/deny"), emitted before the generic `User-agent: *` block.
function aiCrawlerBlocks(settings: AiCrawlerSettings): string {
  const blocked = settings.mode === "blockAll" ? KNOWN_AI_CRAWLERS : settings.mode === "custom" ? settings.blockedBots : [];
  if (blocked.length === 0) return "";
  return blocked.map((bot) => `User-agent: ${bot}\nDisallow: /`).join("\n\n") + "\n\n";
}

// Per-site robots.txt (docs/integrations.md), pointing crawlers at this
// site's own sitemap.xml. Global disallow rules aren't a per-page setting
// (Page-level index/follow directives are handled per-page in
// generateMetadata / sitemap.xml instead), so this stays a fixed template
// aside from the AI-crawler blocks above.
export async function GET(req: Request) {
  const host = (await headers()).get("host");
  const site = await siteFromHost(host);
  if (!site) return new Response("User-agent: *\nDisallow: /", { headers: { "Content-Type": "text/plain" } });

  const aiSettings = (site.settings?.aiCrawlers as unknown as AiCrawlerSettings | undefined) ?? defaultAiCrawlerSettings();
  const origin = new URL(req.url).origin;
  const body = `${aiCrawlerBlocks(aiSettings)}User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
