import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { siteFromHost, siteModeFromHost, resolvePageByHost, renderContextFor } from "@/lib/resolveSite";
import { PublishedPage } from "@/components/PublishedPage";
import { AiChatApp } from "@/components/aiChat/AiChatApp";
import type { PageContent } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";
import { auth } from "@/lib/auth";
import { buildPageMetadata, buildHreflangAlternates, resolveTranslatedSeo, type PageSeo } from "@/lib/seo";
import {
  defaultCustomFonts,
  type CookieBannerSettings,
  type ChatbotEmbedSettings,
  type AnalyticsSettings,
  type CustomFont,
} from "@/lib/siteSettings";

async function resolve(slug: string[]) {
  const host = (await headers()).get("host");
  return resolvePageByHost(host, slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const host = (await headers()).get("host");
  const site = await siteModeFromHost(host);
  if (site?.mode === "AI_CHAT") return { title: site.name };

  const { slug } = await params;
  const result = await resolve(slug ?? []);
  if (!result) return {};
  const seo = resolveTranslatedSeo(result.page.seo as PageSeo | null, result.translations, result.page.id);
  const origin = host ? `${host.includes("localhost") ? "http" : "https"}://${host}` : "";
  const hreflang = buildHreflangAlternates(origin, result.slugPath, result.locales, result.site.defaultLocalePrefixed);
  return buildPageMetadata({ title: result.page.title, seo }, result.site.name, hreflang);
}

export default async function PublicSitePage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const host = (await headers()).get("host");

  // AI_CHAT sites skip the page/block system entirely (docs/ai-mode.md) —
  // resolve the mode first, cheaply, before running the heavier page
  // resolution that assumes a block-based site.
  const modeSite = await siteModeFromHost(host);
  if (modeSite?.mode === "AI_CHAT") {
    return <AiChatApp siteId={modeSite.id} siteName={modeSite.name} />;
  }

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
      analyticsSettings={(result.site.settings?.analytics as unknown as AnalyticsSettings | undefined) ?? null}
      customFonts={(result.site.settings?.customFonts as unknown as CustomFont[] | undefined) ?? defaultCustomFonts()}
    />
  );
}
