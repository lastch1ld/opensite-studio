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
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Same batch of pages as handleCreateFullSite, with the template's
  // placeholder copy replaced by copy written for this business. Reports
  // per-page how many slots were actually filled — a page whose generation
  // failed still gets created with its placeholders, which is a usable
  // starting point rather than a silent gap.
  async function handleGenerate() {
    if (!siteTemplateId || description.trim().length < 20) return;
    setGenerating(true);
    setSiteTemplateNote(null);
    const res = await fetch(`/api/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: siteTemplateId, description }),
    });
    setGenerating(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSiteTemplateNote(data.error ?? "Failed to generate the site.");
      return;
    }
    const data: { created: Page[]; skipped: string[]; copyFilled: { slug: string; filled: number }[] } = await res.json();
    setPages((prev) => [...prev, ...data.created]);
    const withCopy = data.copyFilled.filter((c) => c.filled > 0).length;
    setSiteTemplateNote(
      `Created ${data.created.length} page(s); ${withCopy} got generated copy.` +
        (data.skipped.length ? ` Skipped (slug already exists): ${data.skipped.join(", ")}.` : ""),
    );
    router.refresh();
  }

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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
    }
  }

  function toggleSelected(pageId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === pages.length ? new Set() : new Set(pages.map((p) => p.id))));
  }

  // Same shape as CollectionEditorClient's items table, per the direct
  // request to extend multiselect delete "not just in collections but in
  // the pages list etc." — no bulk endpoint, the existing per-page DELETE
  // route fired concurrently.
  async function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} page${ids.length === 1 ? "" : "s"}?`)) return;
    setBulkDeleting(true);
    const results = await Promise.all(
      ids.map((id) => fetch(`/api/sites/${siteId}/pages/${id}`, { method: "DELETE" }).then((res) => ({ id, ok: res.ok }))),
    );
    setBulkDeleting(false);
    const deleted = new Set(results.filter((r) => r.ok).map((r) => r.id));
    setPages((prev) => prev.filter((p) => !deleted.has(p.id)));
    setSelectedIds(new Set(results.filter((r) => !r.ok).map((r) => r.id)));
    // A home page can't be deleted while it's the only one, so a partial
    // failure is a real outcome here rather than a theoretical one.
    if (deleted.size < ids.length) setError(`${ids.length - deleted.size} page(s) could not be deleted.`);
    router.refresh();
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

          <div className="w-full border-t border-[var(--border)] pt-3">
            <label className="chrome-label">…or describe the business and let AI write the copy</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="A family-run bike repair shop in Bolzano, open since 2016. Same-day tune-ups, custom wheel builds, and winter storage."
              className="chrome-input mt-1 w-full"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating || description.trim().length < 20}
                className="chrome-btn chrome-btn-primary"
                title="Creates the same pages, with the template's placeholder copy replaced by copy written for this business"
              >
                {generating ? "Writing…" : "Generate site copy"}
              </button>
              <span className="text-xs text-[var(--text-muted)]">
                Uses this site&apos;s configured AI key, or the server&apos;s. Structure comes from the template above — only
                the words are generated.
              </span>
            </div>
          </div>
        </div>
      )}

      {pages.length === 0 ? (
        <div className="chrome-card mt-4 px-4 py-14 text-center">
          <p className="text-sm font-medium text-[var(--text)]">No pages yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Create a single page above, or start from a full site template to get a whole set at once.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={pages.length > 0 && selectedIds.size === pages.length}
                onChange={toggleSelectAll}
              />
              Select all
            </label>
            {selectedIds.size > 0 && (
              <button onClick={deleteSelected} disabled={bulkDeleting} className="chrome-btn chrome-btn-danger">
                {bulkDeleting ? "Deleting…" : `Delete ${selectedIds.size} selected`}
              </button>
            )}
          </div>
          <ul className="chrome-card mt-2 divide-y divide-[var(--border)]">
            {pages.map((page) => (
              <li key={page.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(page.id)}
                    onChange={() => toggleSelected(page.id)}
                    aria-label={`Select ${page.title}`}
                  />
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
        </>
      )}
    </div>
  );
}
