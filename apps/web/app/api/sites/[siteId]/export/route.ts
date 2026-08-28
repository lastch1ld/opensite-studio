import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { SITE_EXPORT_VERSION, exportFilename, redactSettings, type SiteExport } from "@/lib/siteExport";

// Whole-site export (see lib/siteExport.ts for what's in it and what is
// deliberately left out). OWNER only: this is every page, every form-free
// piece of content and every integration setting for the site in one file,
// which is a wider read than an EDITOR needs.
export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [pages, theme, templates, collections, locales, translations, settings, media] = await Promise.all([
    db.page.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } }),
    db.theme.findUnique({ where: { siteId } }),
    db.template.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } }),
    db.collection.findMany({ where: { siteId }, orderBy: { createdAt: "asc" }, include: { items: true } }),
    db.locale.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } }),
    db.translation.findMany({ where: { siteId } }),
    db.siteSettings.findUnique({ where: { siteId } }),
    db.media.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } }),
  ]);

  // Pages reference their parent by id internally; the export uses slugs so
  // the document stays meaningful after an import assigns new ids.
  const slugById = new Map(pages.map((p) => [p.id, p.slug]));
  const localeCodeById = new Map(locales.map((l) => [l.id, l.code]));

  const payload: SiteExport = {
    exportVersion: SITE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    site: {
      name: site.name,
      subdomain: site.subdomain,
      customDomain: site.customDomain,
      mode: site.mode,
      defaultLocalePrefixed: site.defaultLocalePrefixed,
    },
    theme: theme?.tokens ?? null,
    pages: pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      isHome: p.isHome,
      parentSlug: p.parentId ? (slugById.get(p.parentId) ?? null) : null,
      collectionId: p.collectionId,
      seo: p.seo ?? null,
      draftContent: p.draftContent,
      publishedContent: p.publishedContent ?? null,
    })),
    templates: templates.map((t) => ({
      name: t.name,
      type: t.type,
      content: t.content,
      condition: t.condition,
      trigger: t.trigger ?? null,
      priority: t.priority,
    })),
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      fieldSchema: c.fieldSchema,
      items: c.items.map((i) => ({ data: i.data })),
    })),
    locales: locales.map((l) => ({ code: l.code, label: l.label, isDefault: l.isDefault })),
    translations: translations.flatMap((t) => {
      const localeCode = localeCodeById.get(t.localeId);
      return localeCode
        ? [{ localeCode, entityType: t.entityType, entityId: t.entityId, blockId: t.blockId, field: t.field, value: t.value }]
        : [];
    }),
    settings: settings
      ? redactSettings({
          cookieBanner: settings.cookieBanner,
          newsletter: settings.newsletter,
          aiCrawlers: settings.aiCrawlers,
          chatbotEmbed: settings.chatbotEmbed,
          aiChat: settings.aiChat,
          customFonts: settings.customFonts,
          analytics: settings.analytics,
        })
      : null,
    media: media.map((m) => ({ storageKey: m.storageKey, url: m.url, mimeType: m.mimeType, altText: m.altText })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${exportFilename(site.subdomain)}"`,
      "Cache-Control": "no-store",
    },
  });
}
