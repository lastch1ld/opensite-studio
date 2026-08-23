"use client";

import { useState } from "react";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

const ALL_SCOPES = ["read", "write", "publish"] as const;

export function ApiKeysPanel({ siteId, initialKeys }: { siteId: string; initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([...ALL_SCOPES]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  function toggleScope(scope: string) {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/sites/${siteId}/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, scopes }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create API key.");
      return;
    }
    const created = await res.json();
    setKeys((prev) => [
      {
        id: created.id,
        name: created.name,
        keyPrefix: created.keyPrefix,
        scopes: created.scopes,
        createdAt: created.createdAt,
        lastUsedAt: null,
        revokedAt: null,
      },
      ...prev,
    ]);
    setRevealedKey(created.key);
    setName("");
    setScopes([...ALL_SCOPES]);
  }

  async function handleRevoke(keyId: string) {
    if (!confirm("Revoke this API key? Anything using it will immediately lose access.")) return;
    const res = await fetch(`/api/sites/${siteId}/api-keys/${keyId}`, { method: "DELETE" });
    if (!res.ok) return;
    const updated = await res.json();
    setKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, revokedAt: updated.revokedAt } : k)));
  }

  return (
    <div>
      <p className="text-sm text-[var(--text-muted)]">
        For the CLI, MCP server, or other scripted access. Scoped to this site only — see docs/api.md.
      </p>

      {revealedKey && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-900">Copy this key now — it won&apos;t be shown again.</p>
          <code className="mt-2 block break-all rounded-[var(--radius-sm)] border border-amber-200 bg-white px-2 py-1.5 text-xs">
            {revealedKey}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(revealedKey);
              setRevealedKey(null);
            }}
            className="chrome-btn chrome-btn-primary mt-3"
          >
            Copy and dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="chrome-card mt-4 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="chrome-label">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CI pipeline"
            required
            className="chrome-input"
          />
        </div>
        <div>
          <label className="chrome-label">Scopes</label>
          <div className="flex gap-3 py-1.5 text-[var(--text)]">
            {ALL_SCOPES.map((scope) => (
              <label key={scope} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} />
                {scope}
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading || scopes.length === 0} className="chrome-btn chrome-btn-primary">
          {loading ? "Creating…" : "Create key"}
        </button>
        {error && <p className="w-full text-sm text-[var(--danger)]">{error}</p>}
      </form>

      {keys.length === 0 ? (
        <div className="chrome-card mt-4 px-4 py-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">No API keys yet.</p>
        </div>
      ) : (
        <ul className="chrome-card mt-4 divide-y divide-[var(--border)]">
          {keys.map((key) => (
            <li key={key.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div>
                <p className="font-medium text-[var(--text)]">
                  {key.name} <span className="text-sm font-normal text-[var(--text-muted)]">({key.scopes.join(", ")})</span>
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  <code className="rounded bg-[var(--surface-sunken)] px-1 py-0.5">{key.keyPrefix}…</code>
                  {key.revokedAt
                    ? " — revoked"
                    : key.lastUsedAt
                      ? ` — last used ${new Date(key.lastUsedAt).toLocaleString()}`
                      : " — never used"}
                </p>
              </div>
              {!key.revokedAt && (
                <button onClick={() => handleRevoke(key.id)} className="chrome-btn chrome-btn-danger shrink-0">
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
