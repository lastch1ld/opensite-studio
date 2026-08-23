import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { actorHasScope, getRequestActor } from "@/lib/apiAuth";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "read")) return NextResponse.json({ error: "This API key's scopes don't allow read access." }, { status: 403 });

  const site = await requireSiteRole(siteId, actor.userId, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const collections = await db.collection.findMany({
    where: { siteId },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(collections);
}

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "write")) return NextResponse.json({ error: "This API key's scopes don't allow write access." }, { status: 403 });

  const site = await requireSiteRole(siteId, actor.userId, ["OWNER", "EDITOR"]);
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
