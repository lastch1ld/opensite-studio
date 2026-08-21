import type { Metadata } from "next";

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

// Builds the `<head>` Metadata for a published page from its SEO fields,
// falling back to the page title / site name pair already used before SEO
// fields existed (see the public route's prior generateMetadata).
export function buildPageMetadata(page: { title: string; seo: PageSeo | null }, siteName: string): Metadata {
  const seo = page.seo ?? {};
  const title = seo.metaTitle || page.title;
  const description = seo.metaDescription || `${siteName} — ${page.title}`;
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;

  return {
    title,
    description,
    alternates: seo.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
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
