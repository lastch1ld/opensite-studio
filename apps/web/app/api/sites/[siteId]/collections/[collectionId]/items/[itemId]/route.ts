import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

async function requireItem(siteId: string, collectionId: string, itemId: string) {
  const item = await db.collectionItem.findUnique({ where: { id: itemId }, include: { collection: true } });
  if (!item || item.collectionId !== collectionId || item.collection.siteId !== siteId) return null;
  return item;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ siteId: string; collectionId: string; itemId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, collectionId, itemId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = await requireItem(siteId, collectionId, itemId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data } = await req.json();
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "data is required" }, { status: 400 });
  }

  const updated = await db.collectionItem.update({
    where: { id: itemId },
    data: { data: data as Prisma.InputJsonValue },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ siteId: string; collectionId: string; itemId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, collectionId, itemId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = await requireItem(siteId, collectionId, itemId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.collectionItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
