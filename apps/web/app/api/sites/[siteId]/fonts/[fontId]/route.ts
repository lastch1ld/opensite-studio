import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { defaultCustomFonts, type CustomFont } from "@/lib/siteSettings";
import type { Prisma } from "@prisma/client";

// Removes the font from the site's selectable list and deletes its
// backing Media row (nothing else references a font's Media row — unlike
// image uploads, which the media library shows for reuse across many
// blocks). The underlying file on disk is left in place, same as image
// Media today (no existing deletion path for those either).
export async function DELETE(_req: Request, { params }: { params: Promise<{ siteId: string; fontId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, fontId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.siteSettings.findUnique({ where: { siteId } });
  const currentFonts = (existing?.customFonts as unknown as CustomFont[] | null) ?? defaultCustomFonts();
  const font = currentFonts.find((f) => f.id === fontId);
  if (!font) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextFonts = currentFonts.filter((f) => f.id !== fontId);
  await db.siteSettings.update({ where: { siteId }, data: { customFonts: nextFonts as unknown as Prisma.InputJsonValue } });
  await db.media.delete({ where: { id: font.mediaId } }).catch(() => {});

  return NextResponse.json({ ok: true });
}
