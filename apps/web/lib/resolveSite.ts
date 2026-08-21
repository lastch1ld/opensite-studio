import { db } from "@/lib/db";
import type { CollectionItemLite, RenderContext } from "@/lib/bind";
import type { TemplateLite } from "@/lib/templates";

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
  const site = await db.site.findUnique({
    where: { subdomain },
    include: {
      theme: true,
      templates: true,
      collections: { include: { items: true } },
      settings: true,
    },
  });
  if (!site) return null;

  const slug = slugSegments.join("/");
  let page = slug
    ? await db.page.findUnique({ where: { siteId_slug: { siteId: site.id, slug } } })
    : await db.page.findFirst({ where: { siteId: site.id, isHome: true } });

  // A dynamic/repeater Page's own slug is just its base route (e.g. "blog")
  // and isn't itself a renderable instance — it only becomes one combined
  // with a trailing CollectionItem segment, resolved below.
  if (page?.collectionId) page = null;

  let currentItem: (CollectionItemLite & { collectionId: string }) | null = null;

  if (!page && slugSegments.length >= 1) {
    const itemKey = slugSegments[slugSegments.length - 1];
    const baseSlug = slugSegments.slice(0, -1).join("/");
    const basePage = await db.page.findUnique({ where: { siteId_slug: { siteId: site.id, slug: baseSlug } } });
    if (basePage?.collectionId) {
      const collection = site.collections.find((c) => c.id === basePage.collectionId);
      const item = collection?.items.find((i) => (i.data as Record<string, unknown>)?.slug === itemKey) ??
        collection?.items.find((i) => i.id === itemKey);
      if (item) {
        page = basePage;
        currentItem = { collectionId: basePage.collectionId, id: item.id, data: item.data as Record<string, unknown> };
      }
    }
  }

  if (!page) return null;

  const collectionItems: Record<string, CollectionItemLite[]> = {};
  for (const c of site.collections) {
    collectionItems[c.id] = c.items.map((i) => ({ id: i.id, data: i.data as Record<string, unknown> }));
  }

  return {
    site,
    page,
    templates: site.templates as unknown as TemplateLite[],
    collectionItems,
    currentItem,
  };
}

export function renderContextFor(result: Awaited<ReturnType<typeof resolvePageBySubdomain>>): RenderContext {
  if (!result) return { device: "desktop" };
  return {
    device: "desktop",
    collectionItems: result.collectionItems,
    currentItem: result.currentItem,
    siteId: result.site.id,
    pageId: result.page.id,
  };
}
