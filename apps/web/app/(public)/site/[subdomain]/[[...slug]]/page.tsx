import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { resolvePageBySubdomain, renderContextFor, siteModeBySubdomain } from "@/lib/resolveSite";
import { PublishedPage } from "@/components/PublishedPage";
import { AiChatApp } from "@/components/aiChat/AiChatApp";
import type { PageContent } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";
import { buildPageMetadata, buildHreflangAlternates, resolveTranslatedSeo, type PageSeo } from "@/lib/seo";
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
  const seo = resolveTranslatedSeo(result.page.seo as PageSeo | null, result.translations, result.page.id);
  const host = (await headers()).get("host");
  // Path-based route, not a real host per Site — base the hreflang origin
  // on this fallback path (/site/{subdomain}/...) rather than the app's own
  // host, so the emitted alternate URLs are actually this route's URLs.
  const origin = host ? `${host.includes("localhost") ? "http" : "https"}://${host}/site/${subdomain}` : "";
  const hreflang = buildHreflangAlternates(origin, result.slugPath, result.locales, result.site.defaultLocalePrefixed);
  return buildPageMetadata({ title: result.page.title, seo }, result.site.name, hreflang);
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
