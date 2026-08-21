"use client";

import { useState } from "react";

type Visitor = { id: string; email: string; name: string | null };

// Login/signup form for an AI_CHAT site's visitor accounts. Separate from
// the CMS author /login and /signup pages — this posts to
// /api/sites/[siteId]/ai/auth/* (lib/visitorAuth.ts), a distinct session
// scoped to this one site.
export function AuthGate({ siteId, siteName, onAuthed }: { siteId: string; siteName: string; onAuthed: (visitor: Visitor) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/sites/${siteId}/ai/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "signup" ? { email, password, name } : { email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }
    const visitor = await res.json();
    onAuthed(visitor);
  }

  return (
    <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, width: 320 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>{siteName}</h1>
        <p style={{ fontSize: 13, color: "#666" }}>{mode === "login" ? "Log in to chat." : "Create an account to chat."}</p>
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ border: "1px solid #ddd", borderRadius: 6, padding: "8px 10px" }}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ border: "1px solid #ddd", borderRadius: 6, padding: "8px 10px" }}
        />
        <input
          type="password"
          placeholder="Password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ border: "1px solid #ddd", borderRadius: 6, padding: "8px 10px" }}
        />
        {error && <p style={{ fontSize: 13, color: "#c0392b" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ background: "#111", color: "#fff", borderRadius: 6, padding: "8px 10px", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          style={{ fontSize: 13, color: "#666", textDecoration: "underline" }}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </form>
    </div>
  );
}
