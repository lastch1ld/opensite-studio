import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVisitor } from "@/lib/visitorAuth";
import { requireAiChatSite } from "@/lib/aiChatSite";
import { checkRateLimit } from "@/lib/rateLimit";
import { decryptSecret } from "@/lib/secrets";
import { streamAnthropicChat } from "@/lib/ai/anthropic";
import { defaultAiChatSettings, type AiChatSettings } from "@/lib/siteSettings";

// Chat proxy (docs/ai-mode.md's `/api/ai/chat`, routed under
// app/api/sites/[siteId]/** to match this project's existing route
// conventions). The provider API key never leaves the server: it's
// decrypted here and attached to the outbound Anthropic request only.
// Rate-limited per visitor since an unmetered proxy in front of someone's
// paid key is a cost-abuse vector (the doc's own framing).
export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const site = await requireAiChatSite(siteId);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const visitor = await getVisitor(siteId);
  if (!visitor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(`ai-chat:${visitor.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests — slow down." }, { status: 429 });
  }

  const { conversationId, message } = await req.json();
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  let conversation;
  if (typeof conversationId === "string" && conversationId) {
    conversation = await db.aiConversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.siteId !== siteId || conversation.visitorId !== visitor.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else {
    conversation = await db.aiConversation.create({
      data: { siteId, visitorId: visitor.id, title: message.trim().slice(0, 60) },
    });
  }

  const settings = await db.siteSettings.findUnique({ where: { siteId } });
  const aiChat = (settings?.aiChat as unknown as AiChatSettings | null) ?? defaultAiChatSettings();
  if (!aiChat.apiKeyEncrypted) {
    return NextResponse.json({ error: "AI Chat isn't configured for this site yet." }, { status: 400 });
  }
  if (aiChat.provider !== "anthropic") {
    return NextResponse.json({ error: `Provider "${aiChat.provider}" isn't implemented yet.` }, { status: 400 });
  }

  const history = await db.aiMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });
  const trimmedMessage = message.trim();
  await db.aiMessage.create({ data: { conversationId: conversation.id, role: "user", content: trimmedMessage } });

  const apiKey = decryptSecret(aiChat.apiKeyEncrypted);
  const providerMessages = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: trimmedMessage },
  ];

  const conversationId_ = conversation.id;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const chunk of streamAnthropicChat({
          apiKey,
          model: aiChat.model,
          systemPrompt: aiChat.systemPrompt,
          messages: providerMessages,
        })) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n[error: ${err instanceof Error ? err.message : "unknown error"}]`));
      } finally {
        if (full) {
          await db.aiMessage.create({ data: { conversationId: conversationId_, role: "assistant", content: full } });
        }
        await db.aiConversation.update({ where: { id: conversationId_ }, data: { updatedAt: new Date() } });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Conversation-Id": conversation.id },
  });
}
