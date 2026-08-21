"use client";

import { useState } from "react";
import type { RenderContext } from "@/lib/bind";

type NewsletterBlockRenderProps = {
  placeholder: string;
  submitLabel: string;
  successMessage: string;
  blockId: string;
  ctx: RenderContext;
};

// Mirrors FormBlock's submit pattern (components/blocks/FormBlock.tsx) —
// posts to a small dedicated API route rather than the forms endpoint,
// since a newsletter signup isn't tied to a `form` block's field schema.
export function NewsletterBlock({ placeholder, submitLabel, successMessage, blockId, ctx }: NewsletterBlockRenderProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ctx.siteId || !ctx.pageId) {
      setStatus("error");
      setError("This form can't be submitted from a preview.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/newsletter/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: ctx.siteId, pageId: ctx.pageId, blockId, email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Signup failed.");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Signup failed.");
    }
  }

  if (status === "done") {
    return <p className="text-sm text-gray-600">{successMessage}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        className="min-w-[220px] flex-1 rounded border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting..." : submitLabel}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
