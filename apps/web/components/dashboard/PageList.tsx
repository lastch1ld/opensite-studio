"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Page = { id: string; title: string; slug: string; isHome: boolean };

export function PageList({ siteId, initialPages }: { siteId: string; initialPages: Page[] }) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isHome, setIsHome] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/sites/${siteId}/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, isHome }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create page.");
      return;
    }
    const page = await res.json();
    setPages((prev) => [...prev, page]);
    setTitle("");
    setSlug("");
    setIsHome(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this page?")) return;
    const res = await fetch(`/api/sites/${siteId}/pages/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPages((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-2 rounded border p-4">
        <div>
          <label className="block text-sm text-gray-600">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="about"
            pattern="[a-z0-9-]*"
            className="rounded border px-3 py-2"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isHome} onChange={(e) => setIsHome(e.target.checked)} />
          Home page
        </label>
        <button type="submit" disabled={loading} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
          {loading ? "Creating..." : "Create page"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <ul className="mt-6 divide-y">
        {pages.map((page) => (
          <li key={page.id} className="flex items-center justify-between py-3">
            <div>
              <Link href={`/edit/${siteId}/${page.id}`} className="font-medium underline">
                {page.title}
              </Link>
              <p className="text-sm text-gray-500">
                /{page.slug} {page.isHome && "(home)"}
              </p>
            </div>
            <button onClick={() => handleDelete(page.id)} className="text-sm text-red-600 underline">
              Delete
            </button>
          </li>
        ))}
        {pages.length === 0 && <p className="py-4 text-sm text-gray-500">No pages yet. Create one above.</p>}
      </ul>
    </div>
  );
}
