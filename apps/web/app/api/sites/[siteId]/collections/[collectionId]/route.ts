import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

async function requireCollection(siteId: string, collectionId: string) {
  const collection = await db.collection.findUnique({ where: { id: collectionId } });
  if (!collection || collection.siteId !== siteId) return null;
  return collection;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ siteId: string; collectionId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, collectionId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const collection = await requireCollection(siteId, collectionId);
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, fieldSchema } = await req.json();
  const data: Prisma.CollectionUpdateInput = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    data.name = name.trim();
  }
  if (fieldSchema !== undefined) {
    if (!Array.isArray(fieldSchema)) {
      return NextResponse.json({ error: "fieldSchema must be an array" }, { status: 400 });
    }
    data.fieldSchema = fieldSchema as Prisma.InputJsonValue;
  }

  const updated = await db.collection.update({ where: { id: collectionId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ siteId: string; collectionId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, collectionId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const collection = await requireCollection(siteId, collectionId);
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.collection.delete({ where: { id: collectionId } });
  return NextResponse.json({ ok: true });
}
