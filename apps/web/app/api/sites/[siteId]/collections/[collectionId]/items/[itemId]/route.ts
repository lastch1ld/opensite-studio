import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { actorHasScope, getRequestActor } from "@/lib/apiAuth";
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
  const { siteId, collectionId, itemId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "write")) return NextResponse.json({ error: "This API key's scopes don't allow write access." }, { status: 403 });

  const site = await requireSiteRole(siteId, actor.userId, ["OWNER", "EDITOR"]);
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
  req: Request,
  { params }: { params: Promise<{ siteId: string; collectionId: string; itemId: string }> },
) {
  const { siteId, collectionId, itemId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "write")) return NextResponse.json({ error: "This API key's scopes don't allow write access." }, { status: 403 });

  const site = await requireSiteRole(siteId, actor.userId, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = await requireItem(siteId, collectionId, itemId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.collectionItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
