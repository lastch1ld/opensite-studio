"use client";

import { useState } from "react";

type Invitation = {
  id: string;
  email: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  token: string;
  acceptedAt: string | null;
};

export function MembersPanel({ siteId, initialInvitations }: { siteId: string; initialInvitations: Invitation[] }) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/sites/${siteId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create invitation.");
      return;
    }
    const invitation = await res.json();
    setInvitations((prev) => [invitation, ...prev]);
    setEmail("");
  }

  function inviteLink(token: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/invite/${token}`;
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold">Members</h2>
      <p className="text-sm text-gray-500">
        No email is sent yet — copy the invite link below and send it to the person manually.
      </p>
      <form onSubmit={handleInvite} className="mt-4 flex flex-wrap items-end gap-2 rounded border p-4">
        <div>
          <label className="block text-sm text-gray-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
            className="rounded border px-3 py-2"
          >
            <option value="EDITOR">Editor</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
          {loading ? "Inviting..." : "Invite"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <ul className="mt-4 divide-y">
        {invitations.map((invitation) => (
          <li key={invitation.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">
                {invitation.email} <span className="text-sm text-gray-500">({invitation.role})</span>
              </p>
              <p className="text-sm text-gray-500">
                {invitation.acceptedAt ? "Accepted" : "Pending"}
              </p>
            </div>
            {!invitation.acceptedAt && (
              <button
                onClick={() => navigator.clipboard.writeText(inviteLink(invitation.token))}
                className="text-sm underline"
              >
                Copy invite link
              </button>
            )}
          </li>
        ))}
        {invitations.length === 0 && <p className="py-4 text-sm text-gray-500">No invitations yet.</p>}
      </ul>
    </div>
  );
}
