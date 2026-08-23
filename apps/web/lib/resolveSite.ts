import { db } from "@/lib/db";
import type { CollectionItemLite, RenderContext } from "@/lib/bind";
import type { TemplateLite } from "@/lib/templates";
import { loadTranslationsMap } from "@/lib/translations";
import type { Locale } from "@prisma/client";

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

const siteWithRelationsInclude = {
  theme: true,
  templates: true,
  collections: { include: { items: true as const } },
  settings: true,
  locales: true,
} as const;

// Verified-custom-domain hosts resolve through this too, so it's the one
// place (besides subdomainFromHost) that decides what counts as "this site's
// host" — sitemap.xml/robots.txt and the catch-all page route both go
// through here rather than re-deriving their own host check.
export async function siteFromHost(host: string | null) {
  const subdomain = subdomainFromHost(host);
  if (subdomain) {
    return db.site.findUnique({ where: { subdomain }, include: siteWithRelationsInclude });
  }

  const hostname = host?.split(":")[0];
  if (!hostname) return null;
  const appDomain = process.env.APP_DOMAIN;
  const appHostname = appDomain?.split(":")[0];
  if (appHostname && (hostname === appHostname || hostname === `www.${appHostname}`)) return null;

  const site = await db.site.findUnique({ where: { customDomain: hostname }, include: siteWithRelationsInclude });
  if (!site || !site.customDomainVerified) return null;
  return site;
}

// Cheap host → Site lookup, used only to check `mode` before deciding
// whether to run the (expensive, block-tree) page resolution at all
// (docs/ai-mode.md: an AI_CHAT site skips the page/block system entirely).
// Deliberately a separate lightweight query rather than reusing
// siteFromHost's heavy include, mirroring the existing pattern of
// resolvePageBySubdomain doing its own site lookup instead of routing
// through siteFromHost.
export async function siteModeFromHost(host: string | null) {
  const subdomain = subdomainFromHost(host);
  if (subdomain) {
    return db.site.findUnique({ where: { subdomain }, select: { id: true, name: true, mode: true } });
  }

  const hostname = host?.split(":")[0];
  if (!hostname) return null;
  const appDomain = process.env.APP_DOMAIN;
  const appHostname = appDomain?.split(":")[0];
  if (appHostname && (hostname === appHostname || hostname === `www.${appHostname}`)) return null;

  const site = await db.site.findUnique({
    where: { customDomain: hostname },
    select: { id: true, name: true, mode: true, customDomainVerified: true },
  });
  if (!site || !site.customDomainVerified) return null;
  return site;
}

export async function siteModeBySubdomain(subdomain: string) {
  return db.site.findUnique({ where: { subdomain }, select: { id: true, name: true, mode: true } });
}

export async function resolvePageBySubdomain(subdomain: string, slugSegments: string[]) {
  const site = await db.site.findUnique({ where: { subdomain }, include: siteWithRelationsInclude });
  if (!site) return null;
  return resolvePageForSite(site, slugSegments);
}

export async function resolvePageByHost(host: string | null, slugSegments: string[]) {
  const site = await siteFromHost(host);
  if (!site) return null;
  return resolvePageForSite(site, slugSegments);
}

// docs/multilingual.md "Routing": host -> Site -> locale segment -> Locale
// -> path -> Page. A leading segment matching a configured Locale's `code`
// (case-insensitively) is stripped and that Locale becomes active; a
// segment matching the default Locale's code is accepted too (regardless
// of `defaultLocalePrefixed` — that flag governs canonical/hreflang
// generation, not what a request is allowed to resolve against, so
// `/en-US/about` and `/about` can both reach the same page even when the
// default is configured "unprefixed"). No match, or no Locales configured
// at all, falls back to the default Locale (or `null` pre-multilingual)
// with the full path treated as the page slug — existing single-locale
// sites keep working unchanged.
export function stripLocalePrefix(
  segments: string[],
  locales: Locale[],
): { locale: Locale | null; rest: string[] } {
  if (!locales.length) return { locale: null, rest: segments };
  const defaultLocale = locales.find((l) => l.isDefault) ?? locales[0];
  const first = segments[0]?.toLowerCase();
  if (first) {
    const matched = locales.find((l) => l.code.toLowerCase() === first);
    if (matched) return { locale: matched, rest: segments.slice(1) };
  }
  return { locale: defaultLocale, rest: segments };
}

async function resolvePageForSite(
  site: NonNullable<Awaited<ReturnType<typeof siteFromHost>>>,
  slugSegments: string[],
) {
  const { locale, rest } = stripLocalePrefix(slugSegments, site.locales ?? []);
  const slug = rest.join("/");
  let page = slug
    ? await db.page.findUnique({ where: { siteId_slug: { siteId: site.id, slug } } })
    : await db.page.findFirst({ where: { siteId: site.id, isHome: true } });

  // A dynamic/repeater Page's own slug is just its base route (e.g. "blog")
  // and isn't itself a renderable instance — it only becomes one combined
  // with a trailing CollectionItem segment, resolved below.
  if (page?.collectionId) page = null;

  let currentItem: (CollectionItemLite & { collectionId: string }) | null = null;

  if (!page && rest.length >= 1) {
    const itemKey = rest[rest.length - 1];
    const baseSlug = rest.slice(0, -1).join("/");
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

  // Default locale never has overrides to look up (the Translation table
  // only ever stores diffs from the base/default content), so skip the
  // query entirely for the common single-locale-site or "viewing default
  // locale" case.
  const translations = locale && !locale.isDefault ? await loadTranslationsMap(site.id, locale.id) : {};

  return {
    site,
    page,
    templates: site.templates as unknown as TemplateLite[],
    collectionItems,
    currentItem,
    locale,
    locales: (site.locales ?? []) as Locale[],
    translations,
    slugPath: slug,
  };
}

// `translationEntity` (which Page/Template's Translation rows apply) is
// deliberately left unset here — PublishedPage.tsx composes header/body/
// footer/popup from potentially-different entities (a Template for
// header/footer, the Page itself or a pageTemplate/collectionItemTemplate
// for the body) and sets it per slot from this same base context.
export function renderContextFor(result: Awaited<ReturnType<typeof resolvePageBySubdomain>>): RenderContext {
  if (!result) return { device: "desktop" };
  return {
    device: "desktop",
    collectionItems: result.collectionItems,
    currentItem: result.currentItem,
    siteId: result.site.id,
    pageId: result.page.id,
    localeId: result.locale?.id ?? null,
    translations: result.translations,
  };
}
