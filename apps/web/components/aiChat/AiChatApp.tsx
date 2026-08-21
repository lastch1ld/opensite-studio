import { ChatShell } from "@/components/aiChat/ChatShell";

// Entry point rendered by the public routing layer when a resolved Site has
// mode === "AI_CHAT" (docs/ai-mode.md) — this is the entire page, not a
// component dropped into a block-based one.
export function AiChatApp({ siteId, siteName }: { siteId: string; siteName: string }) {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ChatShell siteId={siteId} siteName={siteName} />
    </div>
  );
}
