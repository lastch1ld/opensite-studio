import { db } from "@/lib/db";
import type { MembershipRole } from "@prisma/client";

export async function getSiteRole(siteId: string, userId: string): Promise<MembershipRole | null> {
  const site = await db.site.findUnique({ where: { id: siteId } });
  if (!site) return null;
  if (site.ownerId === userId) return "OWNER";
  const membership = await db.membership.findUnique({ where: { siteId_userId: { siteId, userId } } });
  return membership?.role ?? null;
}

export async function requireSiteRole(siteId: string, userId: string, allowed: MembershipRole[]) {
  const role = await getSiteRole(siteId, userId);
  if (!role || !allowed.includes(role)) return null;
  return db.site.findUnique({ where: { id: siteId } });
}

export async function requireSiteOwner(siteId: string, userId: string) {
  return requireSiteRole(siteId, userId, ["OWNER"]);
}

export async function requirePageRole(pageId: string, userId: string, allowed: MembershipRole[]) {
  const page = await db.page.findUnique({ where: { id: pageId }, include: { site: true } });
  if (!page) return null;
  const role = page.site.ownerId === userId
    ? "OWNER"
    : (await db.membership.findUnique({ where: { siteId_userId: { siteId: page.siteId, userId } } }))?.role;
  if (!role || !allowed.includes(role)) return null;
  return page;
}
