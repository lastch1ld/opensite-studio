import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { subdomainFromHost, resolvePageBySubdomain, renderContextFor } from "@/lib/resolveSite";
import { PublishedPage } from "@/components/PublishedPage";
import type { PageContent } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";
import { auth } from "@/lib/auth";
import { buildPageMetadata, type PageSeo } from "@/lib/seo";
import type { CookieBannerSettings } from "@/lib/siteSettings";

async function resolve(slug: string[]) {
  const host = (await headers()).get("host");
  const subdomain = subdomainFromHost(host);
  if (!subdomain) return null;
  return resolvePageBySubdomain(subdomain, slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await resolve(slug ?? []);
  if (!result) return {};
  return buildPageMetadata({ title: result.page.title, seo: result.page.seo as PageSeo | null }, result.site.name);
}

export default async function PublicSitePage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const host = (await headers()).get("host");
  const subdomain = subdomainFromHost(host);

  // Host isn't a recognized site subdomain: this is the studio's own domain
  // (APP_DOMAIN itself, or local dev without APP_DOMAIN set), so behave as
  // the authenticated app's landing page instead of a 404.
  if (!subdomain) {
    const session = await auth();
    redirect(session?.user ? "/dashboard" : "/login");
  }

  const result = await resolvePageBySubdomain(subdomain, slug ?? []);
  if (!result) notFound();

  return (
    <PublishedPage
      content={result.page.publishedContent as unknown as PageContent | null}
      theme={(result.site.theme?.tokens as unknown as ThemeTokens | undefined) ?? null}
      templates={result.templates}
      renderContext={renderContextFor(result)}
      cookieBannerSettings={(result.site.settings?.cookieBanner as unknown as CookieBannerSettings | undefined) ?? null}
    />
  );
}
