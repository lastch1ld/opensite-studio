"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Collection = { id: string; name: string; fieldSchema: unknown[] };

export function CollectionsPanel({ siteId, initialCollections }: { siteId: string; initialCollections: Collection[] }) {
  const router = useRouter();
  const [collections, setCollections] = useState(initialCollections);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/sites/${siteId}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, fieldSchema: [] }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create collection.");
      return;
    }
    const collection = await res.json();
    setCollections((prev) => [...prev, { ...collection, fieldSchema: [] }]);
    setName("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this collection and all its items?")) return;
    const res = await fetch(`/api/sites/${siteId}/collections/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCollections((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-2 rounded border p-4">
        <div>
          <label className="block text-sm text-gray-600">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="rounded border px-3 py-2" />
        </div>
        <button type="submit" disabled={loading} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
          {loading ? "Creating..." : "Create collection"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <ul className="mt-6 divide-y">
        {collections.map((collection) => (
          <li key={collection.id} className="flex items-center justify-between py-3">
            <div>
              <Link href={`/dashboard/sites/${siteId}/collections/${collection.id}`} className="font-medium underline">
                {collection.name}
              </Link>
              <p className="text-sm text-gray-500">{collection.fieldSchema.length} field(s)</p>
            </div>
            <button onClick={() => handleDelete(collection.id)} className="text-sm text-red-600 underline">
              Delete
            </button>
          </li>
        ))}
        {collections.length === 0 && <p className="py-4 text-sm text-gray-500">No collections yet. Create one above.</p>}
      </ul>
    </div>
  );
}
