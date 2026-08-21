import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolvePageBySubdomain, renderContextFor, siteModeBySubdomain } from "@/lib/resolveSite";
import { PublishedPage } from "@/components/PublishedPage";
import { AiChatApp } from "@/components/aiChat/AiChatApp";
import type { PageContent } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";
import { buildPageMetadata, type PageSeo } from "@/lib/seo";
import type { CookieBannerSettings, ChatbotEmbedSettings } from "@/lib/siteSettings";

// Path-based fallback for previewing a published site without wiring real
// wildcard subdomains locally, e.g. /site/my-site/about instead of
// requiring my-site.{APP_DOMAIN} DNS/hosts-file setup.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const modeSite = await siteModeBySubdomain(subdomain);
  if (modeSite?.mode === "AI_CHAT") return { title: modeSite.name };

  const result = await resolvePageBySubdomain(subdomain, slug ?? []);
  if (!result) return {};
  return buildPageMetadata({ title: result.page.title, seo: result.page.seo as PageSeo | null }, result.site.name);
}

export default async function PublicSiteFallbackPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug?: string[] }>;
}) {
  const { subdomain, slug } = await params;

  const modeSite = await siteModeBySubdomain(subdomain);
  if (modeSite?.mode === "AI_CHAT") {
    return <AiChatApp siteId={modeSite.id} siteName={modeSite.name} />;
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
      chatbotEmbedSettings={(result.site.settings?.chatbotEmbed as unknown as ChatbotEmbedSettings | undefined) ?? null}
    />
  );
}
