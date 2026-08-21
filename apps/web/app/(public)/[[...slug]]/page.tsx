import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { siteFromHost, resolvePageByHost, renderContextFor } from "@/lib/resolveSite";
import { PublishedPage } from "@/components/PublishedPage";
import type { PageContent } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";
import { auth } from "@/lib/auth";
import { buildPageMetadata, type PageSeo } from "@/lib/seo";
import type { CookieBannerSettings, ChatbotEmbedSettings } from "@/lib/siteSettings";

async function resolve(slug: string[]) {
  const host = (await headers()).get("host");
  return resolvePageByHost(host, slug);
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
  const result = await resolvePageByHost(host, slug ?? []);

  // Host isn't a recognized site subdomain or verified custom domain: this
  // is the studio's own domain (APP_DOMAIN itself, or local dev without
  // APP_DOMAIN set), so behave as the authenticated app's landing page
  // instead of a 404 — but only when the host doesn't resolve to a real
  // Site at all (subdomain match or verified custom domain); an
  // unresolvable slug on an otherwise-recognized site host is a 404, not
  // the studio's own landing page.
  if (!result) {
    const site = await siteFromHost(host);
    if (!site) {
      const session = await auth();
      redirect(session?.user ? "/dashboard" : "/login");
    }
    notFound();
  }

  return (
    <PublishedPage
      content={result.page.publishedContent as unknown as PageContent | null}
      theme={(result.site.theme?.tokens as unknown as ThemeTokens | undefined) ?? null}
      templates={result.templates}
      renderContext={renderContextFor(result)}
      cookieBannerSettings={(result.site.settings?.cookieBanner as unknown as CookieBannerSettings | undefined) ?? null}
      chatbotEmbedSettings={(result.site.settings?.chatbotEmbed as unknown as ChatbotEmbedSettings | undefined) ?? null}
    />
  );
}
