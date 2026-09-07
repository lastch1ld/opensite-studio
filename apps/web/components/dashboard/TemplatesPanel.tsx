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
  const [blank, setBlank] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only header/footer have authored starter content to opt out of.
  const hasStarter = type === "header" || type === "footer";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/sites/${siteId}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, blank: hasStarter ? blank : true }),
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
      <form onSubmit={handleCreate} className="chrome-card mt-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="chrome-label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="chrome-input" />
        </div>
        <div>
          <label className="chrome-label">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="chrome-input">
            {CREATABLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="chrome-btn chrome-btn-primary">
          {loading ? "Creating…" : "Create template"}
        </button>
        {hasStarter && (
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <input type="checkbox" checked={blank} onChange={(e) => setBlank(e.target.checked)} />
            Start blank instead of from the default {TYPE_LABELS[type].toLowerCase()}
          </label>
        )}
        {error && <p className="w-full text-sm text-[var(--danger)]">{error}</p>}
      </form>

      {templates.length === 0 ? (
        <div className="chrome-card mt-6 px-4 py-14 text-center">
          <p className="text-sm font-medium text-[var(--text)]">No site-wide templates yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            A header and a footer are the usual first two — both start from authored content you can edit.
          </p>
        </div>
      ) : (
        <ul className="chrome-card mt-6 divide-y divide-[var(--border)]">
          {templates.map((template) => (
            <li key={template.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/sites/${siteId}/templates/${template.id}`}
                  className="font-medium text-[var(--text)] hover:text-[var(--accent)]"
                >
                  {template.name}
                </Link>
                <p className="text-xs text-[var(--text-muted)]">{TYPE_LABELS[template.type] ?? template.type}</p>
              </div>
              <button onClick={() => handleDelete(template.id)} className="chrome-btn chrome-btn-danger shrink-0">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
