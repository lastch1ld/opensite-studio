"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptInviteButton({ token, siteId }: { token: string; siteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/invitations/${token}`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to accept invitation.");
      return;
    }
    router.push(`/dashboard/sites/${siteId}`);
  }

  return (
    <div className="mt-4">
      <button onClick={handleAccept} disabled={loading} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
        {loading ? "Joining..." : "Accept invite"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
