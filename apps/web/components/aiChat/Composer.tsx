"use client";

import { useState } from "react";

export function Composer({ disabled, onSend }: { disabled: boolean; onSend: (text: string) => void }) {
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8, padding: 16, borderTop: "1px solid #eee" }}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit(e);
          }
        }}
        placeholder="Message..."
        rows={1}
        style={{ flex: 1, resize: "none", border: "1px solid #ddd", borderRadius: 8, padding: "10px 12px", fontSize: 14 }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        style={{ background: "#111", color: "#fff", borderRadius: 8, padding: "0 18px", opacity: disabled || !value.trim() ? 0.5 : 1 }}
      >
        Send
      </button>
    </form>
  );
}
