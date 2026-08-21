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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteId: string; collectionId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, collectionId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const collection = await requireCollection(siteId, collectionId);
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await db.collectionItem.findMany({ where: { collectionId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(items);
}

export async function POST(
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

  const { data } = await req.json();
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "data is required" }, { status: 400 });
  }

  const item = await db.collectionItem.create({
    data: { collectionId, data: data as Prisma.InputJsonValue },
  });
  return NextResponse.json(item, { status: 201 });
}
