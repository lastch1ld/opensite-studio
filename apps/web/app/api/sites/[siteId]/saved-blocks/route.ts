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

  const savedBlocks = await db.savedBlock.findMany({ where: { siteId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(savedBlocks);
}

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, content } = await req.json();
  if (typeof name !== "string" || !name.trim() || !content || typeof content !== "object") {
    return NextResponse.json({ error: "name and content are required" }, { status: 400 });
  }

  const savedBlock = await db.savedBlock.create({
    data: { siteId, name: name.trim(), content: content as Prisma.InputJsonValue },
  });
  return NextResponse.json(savedBlock, { status: 201 });
}
