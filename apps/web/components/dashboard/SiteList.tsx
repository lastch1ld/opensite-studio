"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { THEME_PRESETS } from "@/lib/themePresets";

type SiteMode = "BUILDER" | "AI_CHAT";
type Site = { id: string; name: string; subdomain: string; mode?: SiteMode };

export function SiteList({ initialSites }: { initialSites: Site[] }) {
  const router = useRouter();
  const [sites, setSites] = useState(initialSites);
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [mode, setMode] = useState<SiteMode>("BUILDER");
  const [themePresetId, setThemePresetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subdomain, mode, themePresetId }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create site.");
      return;
    }
    const site = await res.json();
    setSites((prev) => [site, ...prev]);
    setName("");
    setSubdomain("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this site and all of its pages?")) return;
    const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSites((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="chrome-card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="chrome-label">Site name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="chrome-input" />
        </div>
        <div>
          <label className="chrome-label">Subdomain</label>
          <input
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
            placeholder="my-site"
            pattern="[a-z0-9-]+"
            required
            className="chrome-input"
          />
        </div>
        <div>
          <label className="chrome-label">Site type</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as SiteMode)} className="chrome-input">
            <option value="BUILDER">Page builder</option>
            <option value="AI_CHAT">AI chat app</option>
          </select>
        </div>
        <div>
          <label className="chrome-label">Theme</label>
          <select
            value={themePresetId}
            onChange={(e) => setThemePresetId(e.target.value)}
            className="chrome-input"
            title={THEME_PRESETS.find((p) => p.id === themePresetId)?.description ?? "Start from the plain default tokens."}
          >
            <option value="">Default tokens</option>
            {THEME_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="chrome-btn chrome-btn-primary">
          {loading ? "Creating…" : "Create site"}
        </button>
        {themePresetId && (
          <div className="flex w-full items-center gap-2">
            {(() => {
              const colors = THEME_PRESETS.find((p) => p.id === themePresetId)!.tokens.colors;
              return ["background", "text", "primary", "secondary"].map((key) => (
                <span
                  key={key}
                  title={`${key}: ${colors[key]}`}
                  className="h-5 w-5 rounded-full border border-[var(--border-strong)]"
                  style={{ background: colors[key] }}
                />
              ));
            })()}
            <span className="text-xs text-[var(--text-muted)]">
              {THEME_PRESETS.find((p) => p.id === themePresetId)!.description}
            </span>
          </div>
        )}
        {error && <p className="w-full text-sm text-[var(--danger)]">{error}</p>}
      </form>

      {sites.length === 0 ? (
        <div className="chrome-card mt-6 px-4 py-14 text-center">
          <p className="text-sm text-[var(--text-muted)]">No sites yet — create one above to get started.</p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sites.map((site) => (
            <li key={site.id} className="chrome-card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/dashboard/sites/${site.id}`} className="font-medium text-[var(--text)] hover:text-[var(--accent)]">
                  {site.name}
                </Link>
                <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                  {site.subdomain}
                  {site.mode === "AI_CHAT" && (
                    <span className="ml-1.5 rounded-full bg-[var(--surface-sunken)] px-1.5 py-0.5">AI chat</span>
                  )}
                </p>
              </div>
              <button onClick={() => handleDelete(site.id)} className="chrome-btn chrome-btn-danger shrink-0">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
