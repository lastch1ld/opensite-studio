import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteRole } from "@/lib/permissions";
import { PublishedPage } from "@/components/PublishedPage";
import type { PageContent } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";
import type { CollectionItemLite, RenderContext } from "@/lib/bind";
import type { TemplateLite } from "@/lib/templates";
import { defaultCustomFonts, type CookieBannerSettings, type ChatbotEmbedSettings, type CustomFont } from "@/lib/siteSettings";

// A real look at a Page's *draft* content — the public routes
// (app/(public)/**) only ever read `publishedContent` by design
// (architecture.md), so this is the one place an unpublished edit is
// actually visible outside the editor canvas's own simulated-breakpoint
// frame. Reuses PublishedPage (the same render path a visitor gets), so
// "preview" is never a second, potentially-diverging rendering
// implementation — just a different `content` source. Requires any site
// Membership (OWNER/EDITOR/VIEWER); not a public route.
export default async function DraftPreviewPage({
  params,
}: {
  params: Promise<{ siteId: string; pageId: string }>;
}) {
  const { siteId, pageId } = await params;
  const session = await auth();
  if (!session?.user) notFound();
  const role = await getSiteRole(siteId, session.user.id);
  if (!role) notFound();

  const site = await db.site.findUnique({
    where: { id: siteId },
    include: { theme: true, templates: true, collections: { include: { items: true } }, settings: true },
  });
  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!site || !page || page.siteId !== siteId) notFound();

  const collectionItems: Record<string, CollectionItemLite[]> = {};
  for (const c of site.collections) {
    collectionItems[c.id] = c.items.map((i) => ({ id: i.id, data: i.data as Record<string, unknown> }));
  }

  const renderContext: RenderContext = {
    device: "desktop",
    collectionItems,
    currentItem: null,
    siteId: site.id,
    pageId: page.id,
    localeId: null,
    translations: {},
  };

  return (
    <>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#0B1120",
          color: "#F8FAFC",
          padding: "8px 16px",
          fontSize: "13px",
          textAlign: "center",
        }}
      >
        Draft preview — unpublished changes, visible only to people with access to this site.
      </div>
      <PublishedPage
        content={page.draftContent as unknown as PageContent}
        theme={(site.theme?.tokens as unknown as ThemeTokens | undefined) ?? null}
        templates={site.templates as unknown as TemplateLite[]}
        renderContext={renderContext}
        cookieBannerSettings={(site.settings?.cookieBanner as unknown as CookieBannerSettings | undefined) ?? null}
        chatbotEmbedSettings={(site.settings?.chatbotEmbed as unknown as ChatbotEmbedSettings | undefined) ?? null}
        customFonts={(site.settings?.customFonts as unknown as CustomFont[] | undefined) ?? defaultCustomFonts()}
      />
    </>
  );
}
