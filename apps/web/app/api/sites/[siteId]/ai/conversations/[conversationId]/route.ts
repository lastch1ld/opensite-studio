import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVisitor } from "@/lib/visitorAuth";

async function loadOwnConversation(siteId: string, conversationId: string, visitorId: string) {
  const conversation = await db.aiConversation.findUnique({ where: { id: conversationId } });
  if (!conversation || conversation.siteId !== siteId || conversation.visitorId !== visitorId) return null;
  return conversation;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteId: string; conversationId: string }> },
) {
  const { siteId, conversationId } = await params;
  const visitor = await getVisitor(siteId);
  if (!visitor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversation = await loadOwnConversation(siteId, conversationId, visitor.id);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await db.aiMessage.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ conversation, messages });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ siteId: string; conversationId: string }> },
) {
  const { siteId, conversationId } = await params;
  const visitor = await getVisitor(siteId);
  if (!visitor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversation = await loadOwnConversation(siteId, conversationId, visitor.id);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title } = await req.json();
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const updated = await db.aiConversation.update({ where: { id: conversationId }, data: { title: title.trim() } });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ siteId: string; conversationId: string }> },
) {
  const { siteId, conversationId } = await params;
  const visitor = await getVisitor(siteId);
  if (!visitor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversation = await loadOwnConversation(siteId, conversationId, visitor.id);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.aiConversation.delete({ where: { id: conversationId } });
  return NextResponse.json({ ok: true });
}
