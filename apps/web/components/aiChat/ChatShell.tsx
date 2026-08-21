"use client";

import { useEffect, useRef, useState } from "react";
import { AuthGate } from "@/components/aiChat/AuthGate";
import { MessageThread, type ChatMessage } from "@/components/aiChat/MessageThread";
import { Composer } from "@/components/aiChat/Composer";

type Visitor = { id: string; email: string; name: string | null };
type Conversation = { id: string; title: string; updatedAt: string };

export function ChatShell({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [visitor, setVisitor] = useState<Visitor | null | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const streamingIdRef = useRef<string | null>(null);

  useEffect(() => {
    fetch(`/api/sites/${siteId}/ai/auth/me`)
      .then((r) => r.json())
      .then((data) => setVisitor(data.visitor));
  }, [siteId]);

  useEffect(() => {
    if (!visitor) return;
    fetch(`/api/sites/${siteId}/ai/conversations`)
      .then((r) => r.json())
      .then((data: Conversation[]) => setConversations(data));
  }, [siteId, visitor]);

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/sites/${siteId}/ai/conversations/${activeId}`)
      .then((r) => r.json())
      .then((data: { messages: { id: string; role: "user" | "assistant"; content: string }[] }) => {
        setMessages(data.messages.map((m) => ({ id: m.id, role: m.role, content: m.content })));
      });
  }, [siteId, activeId]);

  async function handleNewChat() {
    setActiveId(null);
    setMessages([]);
  }

  async function handleRename(id: string) {
    const title = prompt("Rename conversation");
    if (!title || !title.trim()) return;
    const res = await fetch(`/api/sites/${siteId}/ai/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this conversation?")) return;
    const res = await fetch(`/api/sites/${siteId}/ai/conversations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    }
  }

  async function handleSend(text: string) {
    const userMessage: ChatMessage = { id: `local-${Date.now()}`, role: "user", content: text };
    const assistantId = `local-${Date.now()}-assistant`;
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }]);
    streamingIdRef.current = assistantId;
    setStreaming(true);

    const res = await fetch(`/api/sites/${siteId}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeId, message: text }),
    });

    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: data.error ?? "Something went wrong." } : m)),
      );
      setStreaming(false);
      return;
    }

    const newConversationId = res.headers.get("X-Conversation-Id");
    if (newConversationId && newConversationId !== activeId) {
      setActiveId(newConversationId);
      setConversations((prev) => [{ id: newConversationId, title: text.slice(0, 60), updatedAt: new Date().toISOString() }, ...prev]);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)));
    }
    setStreaming(false);
  }

  if (visitor === undefined) return null;
  if (visitor === null) {
    return <AuthGate siteId={siteId} siteName={siteName} onAuthed={setVisitor} />;
  }

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: "sans-serif" }}>
      <aside style={{ width: 260, borderRight: "1px solid #eee", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #eee" }}>
          <h1 style={{ fontSize: 15, fontWeight: 600 }}>{siteName}</h1>
          <button
            type="button"
            onClick={handleNewChat}
            style={{ marginTop: 10, width: "100%", border: "1px solid #ddd", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}
          >
            + New chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setMessages([]);
                setActiveId(c.id);
              }}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                background: activeId === c.id ? "#f0f0f0" : "transparent",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
              <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(c.id);
                  }}
                  style={{ color: "#666" }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c.id);
                  }}
                  style={{ color: "#c0392b" }}
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
        </div>
      </aside>
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <MessageThread messages={messages} streaming={streaming} />
        <Composer disabled={streaming} onSend={handleSend} />
      </main>
    </div>
  );
}
