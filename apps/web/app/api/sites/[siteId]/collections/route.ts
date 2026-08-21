import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const collections = await db.collection.findMany({
    where: { siteId },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(collections);
}

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, fieldSchema } = await req.json();
  if (typeof name !== "string" || !name.trim() || !Array.isArray(fieldSchema)) {
    return NextResponse.json({ error: "name and fieldSchema (array) are required" }, { status: 400 });
  }

  const collection = await db.collection.create({
    data: { siteId, name: name.trim(), fieldSchema: fieldSchema as Prisma.InputJsonValue },
  });
  return NextResponse.json(collection, { status: 201 });
}
