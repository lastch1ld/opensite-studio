"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TemplateSummary = { id: string; name: string; type: string };

const TYPE_LABELS: Record<string, string> = {
  header: "Header",
  footer: "Footer",
  pageTemplate: "Page template",
  collectionItemTemplate: "Collection item template",
  popup: "Popup",
};

const CREATABLE_TYPES = Object.keys(TYPE_LABELS);

export function TemplatesPanel({ siteId, initialTemplates }: { siteId: string; initialTemplates: TemplateSummary[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [name, setName] = useState("");
  const [type, setType] = useState(CREATABLE_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/sites/${siteId}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create template.");
      return;
    }
    const template = await res.json();
    setTemplates((prev) => [...prev, template]);
    setName("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    const res = await fetch(`/api/sites/${siteId}/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
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
        <div>
          <label className="block text-sm text-gray-600">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border px-3 py-2">
            {CREATABLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
          {loading ? "Creating..." : "Create template"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <ul className="mt-6 divide-y">
        {templates.map((template) => (
          <li key={template.id} className="flex items-center justify-between py-3">
            <div>
              <Link href={`/dashboard/sites/${siteId}/templates/${template.id}`} className="font-medium underline">
                {template.name}
              </Link>
              <p className="text-sm text-gray-500">{TYPE_LABELS[template.type] ?? template.type}</p>
            </div>
            <button onClick={() => handleDelete(template.id)} className="text-sm text-red-600 underline">
              Delete
            </button>
          </li>
        ))}
        {templates.length === 0 && <p className="py-4 text-sm text-gray-500">No templates yet. Create one above.</p>}
      </ul>
    </div>
  );
}
