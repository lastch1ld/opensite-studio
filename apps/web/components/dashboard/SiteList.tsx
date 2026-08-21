"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SiteMode = "BUILDER" | "AI_CHAT";
type Site = { id: string; name: string; subdomain: string; mode?: SiteMode };

export function SiteList({ initialSites }: { initialSites: Site[] }) {
  const router = useRouter();
  const [sites, setSites] = useState(initialSites);
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [mode, setMode] = useState<SiteMode>("BUILDER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subdomain, mode }),
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
      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-2 rounded border p-4">
        <div>
          <label className="block text-sm text-gray-600">Site name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Subdomain</label>
          <input
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
            placeholder="my-site"
            pattern="[a-z0-9-]+"
            required
            className="rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Site type</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as SiteMode)}
            className="rounded border px-3 py-2"
          >
            <option value="BUILDER">Page builder</option>
            <option value="AI_CHAT">AI chat app</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
          {loading ? "Creating..." : "Create site"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <ul className="mt-6 divide-y">
        {sites.map((site) => (
          <li key={site.id} className="flex items-center justify-between py-3">
            <div>
              <Link href={`/dashboard/sites/${site.id}`} className="font-medium underline">
                {site.name}
              </Link>
              <p className="text-sm text-gray-500">
                {site.subdomain}
                {site.mode === "AI_CHAT" && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs">AI chat</span>}
              </p>
            </div>
            <button onClick={() => handleDelete(site.id)} className="text-sm text-red-600 underline">
              Delete
            </button>
          </li>
        ))}
        {sites.length === 0 && <p className="py-4 text-sm text-gray-500">No sites yet. Create one above.</p>}
      </ul>
    </div>
  );
}
