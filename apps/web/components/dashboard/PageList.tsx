"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SitemapImportPanel } from "./SitemapImportPanel";
import { PAGE_TEMPLATES } from "@/lib/pageTemplateOptions";
import { SITE_TEMPLATES } from "@/lib/siteTemplateOptions";

type Page = { id: string; title: string; slug: string; isHome: boolean; collectionId: string | null };
type CollectionOption = { id: string; name: string };

export function PageList({
  siteId,
  initialPages,
  collections = [],
}: {
  siteId: string;
  initialPages: Page[];
  collections?: CollectionOption[];
}) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isHome, setIsHome] = useState(false);
  const [template, setTemplate] = useState(PAGE_TEMPLATES[0].id);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [siteTemplateId, setSiteTemplateId] = useState(SITE_TEMPLATES[0]?.id ?? "");
  const [siteTemplateLoading, setSiteTemplateLoading] = useState(false);
  const [siteTemplateNote, setSiteTemplateNote] = useState<string | null>(null);

  async function handleCreateFullSite() {
    if (!siteTemplateId) return;
    setSiteTemplateLoading(true);
    setSiteTemplateNote(null);
    const res = await fetch(`/api/sites/${siteId}/site-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: siteTemplateId }),
    });
    setSiteTemplateLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSiteTemplateNote(data.error ?? "Failed to create site.");
      return;
    }
    const data: { created: Page[]; skipped: string[] } = await res.json();
    setPages((prev) => [...prev, ...data.created]);
    setSiteTemplateNote(
      data.skipped.length
        ? `Created ${data.created.length} page(s). Skipped (slug already exists): ${data.skipped.join(", ")}.`
        : `Created ${data.created.length} page(s).`,
    );
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/sites/${siteId}/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, isHome, template }),
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
    setTemplate(PAGE_TEMPLATES[0].id);
    router.refresh();
  }

  async function handleCollectionChange(pageId: string, collectionId: string) {
    const res = await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId: collectionId || null }),
    });
    if (res.ok) {
      setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, collectionId: collectionId || null } : p)));
      router.refresh();
    }
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
      <form onSubmit={handleCreate} className="chrome-card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="chrome-label">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="chrome-input" />
        </div>
        <div>
          <label className="chrome-label">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="about"
            pattern="[a-z0-9-]*"
            className="chrome-input"
          />
        </div>
        <div>
          <label className="chrome-label">Start from</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="chrome-input"
            title={PAGE_TEMPLATES.find((t) => t.id === template)?.description}
          >
            {PAGE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id} title={t.description}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2.5 text-sm text-[var(--text)]">
          <input type="checkbox" checked={isHome} onChange={(e) => setIsHome(e.target.checked)} />
          Home page
        </label>
        <button type="submit" disabled={loading} className="chrome-btn chrome-btn-primary">
          {loading ? "Creating…" : "Create page"}
        </button>
        <SitemapImportPanel
          siteId={siteId}
          existingSlugs={pages.map((p) => p.slug)}
          onImported={(imported) => {
            setPages((prev) => [...prev, ...imported]);
            router.refresh();
          }}
        />
        {error && <p className="w-full text-sm text-[var(--danger)]">{error}</p>}
      </form>

      {SITE_TEMPLATES.length > 0 && (
        <div className="chrome-card mt-4 flex flex-wrap items-end gap-3 p-4">
          <div>
            <label className="chrome-label">Create a full site</label>
            <select
              value={siteTemplateId}
              onChange={(e) => setSiteTemplateId(e.target.value)}
              className="chrome-input"
              title={SITE_TEMPLATES.find((t) => t.id === siteTemplateId)?.description}
            >
              {SITE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id} title={t.description}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleCreateFullSite} disabled={siteTemplateLoading} className="chrome-btn chrome-btn-secondary">
            {siteTemplateLoading ? "Creating…" : `Create ${SITE_TEMPLATES.find((t) => t.id === siteTemplateId)?.pages.length ?? 0} pages`}
          </button>
          {siteTemplateNote && <p className="w-full text-sm text-[var(--text-muted)]">{siteTemplateNote}</p>}
        </div>
      )}

      {pages.length === 0 ? (
        <div className="chrome-card mt-4 px-4 py-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">No pages yet — create one above to get started.</p>
        </div>
      ) : (
        <ul className="chrome-card mt-4 divide-y divide-[var(--border)]">
          {pages.map((page) => (
            <li key={page.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <Link href={`/edit/${siteId}/${page.id}`} className="font-medium text-[var(--text)] hover:text-[var(--accent)]">
                  {page.title}
                </Link>
                <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                  /{page.slug}
                  {page.isHome && <span className="ml-1.5 rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[var(--accent)]">home</span>}
                  {page.collectionId && <span className="ml-1.5 rounded-full bg-[var(--surface-sunken)] px-1.5 py-0.5">dynamic</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {collections.length > 0 && (
                  <select
                    value={page.collectionId ?? ""}
                    onChange={(e) => handleCollectionChange(page.id, e.target.value)}
                    className="chrome-input !py-1 text-xs"
                    title="Bind this page to a collection to make it a dynamic/repeater page"
                  >
                    <option value="">Static page</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        Dynamic: {c.name}
                      </option>
                    ))}
                  </select>
                )}
                <Link href={`/dashboard/sites/${siteId}/pages/${page.id}/submissions`} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                  Submissions
                </Link>
                <button onClick={() => handleDelete(page.id)} className="chrome-btn chrome-btn-danger !px-2 !py-1">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
