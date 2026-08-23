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
    <div>
      <p className="text-sm text-[var(--text-muted)]">
        No email is sent yet — copy the invite link below and send it to the person manually.
      </p>
      <form onSubmit={handleInvite} className="chrome-card mt-4 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="chrome-label">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="chrome-input" />
        </div>
        <div>
          <label className="chrome-label">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")} className="chrome-input">
            <option value="EDITOR">Editor</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="chrome-btn chrome-btn-primary">
          {loading ? "Inviting…" : "Invite"}
        </button>
        {error && <p className="w-full text-sm text-[var(--danger)]">{error}</p>}
      </form>

      {invitations.length === 0 ? (
        <div className="chrome-card mt-4 px-4 py-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">No invitations yet.</p>
        </div>
      ) : (
        <ul className="chrome-card mt-4 divide-y divide-[var(--border)]">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div>
                <p className="font-medium text-[var(--text)]">
                  {invitation.email} <span className="text-sm font-normal text-[var(--text-muted)]">({invitation.role})</span>
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{invitation.acceptedAt ? "Accepted" : "Pending"}</p>
              </div>
              {!invitation.acceptedAt && (
                <button
                  onClick={() => navigator.clipboard.writeText(inviteLink(invitation.token))}
                  className="chrome-btn chrome-btn-secondary shrink-0"
                >
                  Copy invite link
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
