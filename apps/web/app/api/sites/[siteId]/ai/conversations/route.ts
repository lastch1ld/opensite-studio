import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVisitor } from "@/lib/visitorAuth";
import { requireAiChatSite } from "@/lib/aiChatSite";

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const visitor = await getVisitor(siteId);
  if (!visitor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await db.aiConversation.findMany({
    where: { siteId, visitorId: visitor.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(conversations);
}

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const site = await requireAiChatSite(siteId);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const visitor = await getVisitor(siteId);
  if (!visitor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : "New chat";

  const conversation = await db.aiConversation.create({ data: { siteId, visitorId: visitor.id, title } });
  return NextResponse.json(conversation, { status: 201 });
}
