import { db } from "@/lib/db";

// Real wildcard subdomains (`{subdomain}.${APP_DOMAIN}`) need DNS/hosts-file
// setup that isn't available out of the box in local dev, so the public
// renderer also accepts a path-based fallback at /_site/[subdomain]/... .
// Both paths resolve through this same function so there's one lookup path.
export function subdomainFromHost(host: string | null): string | null {
  if (!host) return null;
  const appDomain = process.env.APP_DOMAIN;
  const hostname = host.split(":")[0];

  if (appDomain) {
    const appHostname = appDomain.split(":")[0];
    if (hostname === appHostname || hostname === `www.${appHostname}`) return null;
    if (hostname.endsWith(`.${appHostname}`)) {
      return hostname.slice(0, -(appHostname.length + 1));
    }
  }
  return null;
}

export async function resolvePageBySubdomain(subdomain: string, slugSegments: string[]) {
  const site = await db.site.findUnique({ where: { subdomain } });
  if (!site) return null;

  const slug = slugSegments.join("/");
  const page = slug
    ? await db.page.findUnique({ where: { siteId_slug: { siteId: site.id, slug } } })
    : await db.page.findFirst({ where: { siteId: site.id, isHome: true } });

  if (!page) return null;
  return { site, page };
}
