import type { Metadata } from "next";
import { resolveTranslatedValue } from "./translations";

// Page.seo (docs/integrations.md "SEO"). All fields optional — an unset
// field falls back to the page title/site name at render time, never to a
// hardcoded default that would look the same across every site.
export type PageSeo = {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
  robotsIndex?: boolean;
  robotsFollow?: boolean;
};

export function defaultPageSeo(): PageSeo {
  return { robotsIndex: true, robotsFollow: true };
}

export function isPageIndexable(seo: PageSeo | null | undefined): boolean {
  return seo?.robotsIndex !== false;
}

// docs/multilingual.md's "meta title/description" translatable-field
// example: overrides a Page's `seo.metaTitle`/`seo.metaDescription` with the
// active locale's Translation rows, same shared resolveTranslatedValue used
// for block props (lib/translations.ts) and CollectionItem fields
// (lib/bind.ts). A no-op when `translations` is undefined (default locale).
export function resolveTranslatedSeo(
  seo: PageSeo | null | undefined,
  translations: Record<string, string> | undefined,
  pageId: string,
): PageSeo {
  const base = seo ?? {};
  if (!translations) return base;
  const metaTitle = resolveTranslatedValue(
    translations,
    { entityType: "page", entityId: pageId, blockId: null, field: "seo.metaTitle" },
    base.metaTitle ?? "",
  ).value;
  const metaDescription = resolveTranslatedValue(
    translations,
    { entityType: "page", entityId: pageId, blockId: null, field: "seo.metaDescription" },
    base.metaDescription ?? "",
  ).value;
  return { ...base, metaTitle: metaTitle || undefined, metaDescription: metaDescription || undefined };
}

// Builds `hreflang` alternates for a rendered page's `<head>` (docs/
// multilingual.md "Routing": "hreflang tags emitted per page ... for every
// configured Locale of that Site"). `slugPath` is the page's own slug
// (empty string for the home page) — shared across every locale in this
// version, since translating the URL slug itself isn't part of this pass
// (only field-level content is). A locale is only prefixed in its URL when
// it isn't the default, or the Site opts every locale (including default)
// into prefixing.
export function buildHreflangAlternates(
  origin: string,
  slugPath: string,
  locales: { code: string; isDefault: boolean }[],
  defaultLocalePrefixed: boolean,
): Record<string, string> | undefined {
  if (locales.length < 2) return undefined;
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const prefixed = !locale.isDefault || defaultLocalePrefixed;
    const path = prefixed ? `/${locale.code}${slugPath ? `/${slugPath}` : ""}` : slugPath ? `/${slugPath}` : "/";
    languages[locale.code] = `${origin}${path}`;
  }
  return languages;
}

// Builds the `<head>` Metadata for a published page from its SEO fields,
// falling back to the page title / site name pair already used before SEO
// fields existed (see the public route's prior generateMetadata).
export function buildPageMetadata(
  page: { title: string; seo: PageSeo | null },
  siteName: string,
  hreflang?: Record<string, string>,
): Metadata {
  const seo = page.seo ?? {};
  const title = seo.metaTitle || page.title;
  const description = seo.metaDescription || `${siteName} — ${page.title}`;
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;

  return {
    title,
    description,
    alternates:
      seo.canonicalUrl || hreflang
        ? { canonical: seo.canonicalUrl, languages: hreflang }
        : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
    twitter: {
      card: seo.twitterCard ?? "summary",
      title: ogTitle,
      description: ogDescription,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
    robots: {
      index: seo.robotsIndex !== false,
      follow: seo.robotsFollow !== false,
    },
  };
}
