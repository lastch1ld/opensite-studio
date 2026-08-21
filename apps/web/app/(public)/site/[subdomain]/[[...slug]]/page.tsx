import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolvePageBySubdomain } from "@/lib/resolveSite";
import { PublishedPage } from "@/components/PublishedPage";
import type { PageContent } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";

// Path-based fallback for previewing a published site without wiring real
// wildcard subdomains locally, e.g. /site/my-site/about instead of
// requiring my-site.{APP_DOMAIN} DNS/hosts-file setup.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const result = await resolvePageBySubdomain(subdomain, slug ?? []);
  if (!result) return {};
  return { title: result.page.title, description: `${result.site.name} — ${result.page.title}` };
}

export default async function PublicSiteFallbackPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug?: string[] }>;
}) {
  const { subdomain, slug } = await params;
  const result = await resolvePageBySubdomain(subdomain, slug ?? []);
  if (!result) notFound();

  return (
    <PublishedPage
      content={result.page.publishedContent as unknown as PageContent | null}
      theme={(result.site.theme?.tokens as unknown as ThemeTokens | undefined) ?? null}
    />
  );
}
