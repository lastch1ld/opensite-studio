import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pageId } = await params;
  const page = await requirePageRole(pageId, session.user.id, ["OWNER", "EDITOR"]);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { draftContent, collectionId, seo, isHome } = await req.json();
  if (draftContent === undefined && collectionId === undefined && seo === undefined && isHome === undefined) {
    return NextResponse.json({ error: "draftContent, collectionId, seo, or isHome is required" }, { status: 400 });
  }

  const data: Prisma.PageUpdateInput = {};
  if (draftContent !== undefined) data.draftContent = draftContent as Prisma.InputJsonValue;
  if (collectionId !== undefined) {
    data.collection = collectionId ? { connect: { id: collectionId as string } } : { disconnect: true };
  }
  if (seo !== undefined) data.seo = seo as Prisma.InputJsonValue;
  if (isHome !== undefined) data.isHome = Boolean(isHome);

  const updated = await db.$transaction(async (tx) => {
    if (isHome) {
      await tx.page.updateMany({ where: { siteId: page.siteId, isHome: true, NOT: { id: pageId } }, data: { isHome: false } });
    }
    return tx.page.update({ where: { id: pageId }, data });
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pageId } = await params;
  const page = await requirePageRole(pageId, session.user.id, ["OWNER", "EDITOR"]);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.page.delete({ where: { id: pageId } });
  return NextResponse.json({ ok: true });
}
