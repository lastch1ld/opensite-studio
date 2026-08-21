export type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

// Lightweight markdown: fenced code blocks and paragraphs only (no list/bold
// parsing) — an acceptable first pass per docs/ai-mode.md rather than
// pulling in a markdown dependency. Splits on ``` fences, renders the rest
// as paragraphs on blank-line boundaries. Plain text throughout — React
// escapes it, no dangerouslySetInnerHTML involved.
function renderMarkdownLite(content: string) {
  const parts = content.split(/```/);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const firstNewline = part.indexOf("\n");
      const code = firstNewline === -1 ? part : part.slice(firstNewline + 1);
      return (
        <pre key={i} style={{ background: "#f5f5f5", borderRadius: 6, padding: 12, overflowX: "auto", fontSize: 13 }}>
          <code>{code.replace(/\n$/, "")}</code>
        </pre>
      );
    }
    return part
      .split(/\n{2,}/)
      .filter((p) => p.trim())
      .map((para, j) => (
        <p key={`${i}-${j}`} style={{ whiteSpace: "pre-wrap", margin: "0 0 8px" }}>
          {para}
        </p>
      ));
  });
}

export function MessageThread({ messages, streaming }: { messages: ChatMessage[]; streaming: boolean }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {messages.length === 0 && !streaming && (
        <p style={{ color: "#888", fontSize: 14, textAlign: "center", marginTop: 40 }}>Say hello to start the conversation.</p>
      )}
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "75%",
            background: m.role === "user" ? "#111" : "#f0f0f0",
            color: m.role === "user" ? "#fff" : "#111",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 14,
          }}
        >
          {renderMarkdownLite(m.content)}
        </div>
      ))}
    </div>
  );
}
