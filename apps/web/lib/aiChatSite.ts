import { db } from "@/lib/db";

// Shared guard used by every AI Mode API route (docs/ai-mode.md): the
// site must exist and be flagged AI_CHAT, otherwise none of the chat/visitor
// endpoints are meaningful for it.
export async function requireAiChatSite(siteId: string) {
  const site = await db.site.findUnique({ where: { id: siteId } });
  if (!site || site.mode !== "AI_CHAT") return null;
  return site;
}
