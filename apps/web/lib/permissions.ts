import { db } from "@/lib/db";

export async function requireSiteOwner(siteId: string, userId: string) {
  const site = await db.site.findUnique({ where: { id: siteId } });
  if (!site || site.ownerId !== userId) return null;
  return site;
}

export async function requirePageOwner(pageId: string, userId: string) {
  const page = await db.page.findUnique({
    where: { id: pageId },
    include: { site: true },
  });
  if (!page || page.site.ownerId !== userId) return null;
  return page;
}
