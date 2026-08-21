"use client";

import { useState } from "react";

type Entry = {
  suggestedSlug: string;
  suggestedTitle: string;
  sourceUrl: string;
  depth: number;
  isHome: boolean;
  parentSlug: string | null;
};

type ReviewRow = Entry & { selected: boolean; slug: string; title: string };

type ImportedPage = { id: string; title: string; slug: string; isHome: boolean; collectionId: string | null };

export function SitemapImportPanel({
  siteId,
  existingSlugs,
  onImported,
}: {
  siteId: string;
  existingSlugs: string[];
  onImported: (pages: ImportedPage[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"sitemapUrl" | "file" | "rootUrl">("sitemapUrl");
  const [urlValue, setUrlValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [source, setSource] = useState<"sitemap" | "crawl" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const existing = new Set(existingSlugs);

  function reset() {
    setUrlValue("");
    setFile(null);
    setRows(null);
    setSource(null);
    setError(null);
  }

  async function handleParse(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    if (method === "file" && file) formData.append("file", file);
    else if (method === "sitemapUrl") formData.append("sitemapUrl", urlValue);
    else if (method === "rootUrl") formData.append("rootUrl", urlValue);

    const res = await fetch(`/api/sites/${siteId}/import/sitemap`, { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to parse.");
      return;
    }
    const entries = data.entries as Entry[];
    setSource(data.source);
    setRows(
      entries.map((entry) => ({
        ...entry,
        selected: !existing.has(entry.suggestedSlug),
        slug: entry.suggestedSlug,
        title: entry.suggestedTitle,
      })),
    );
  }

  function updateRow(index: number, patch: Partial<ReviewRow>) {
    setRows((prev) => (prev ? prev.map((r, i) => (i === index ? { ...r, ...patch } : r)) : prev));
  }

  async function handleCommit() {
    if (!rows) return;
    setLoading(true);
    setError(null);
    const entries = rows
      .filter((r) => r.selected)
      .map((r) => ({ slug: r.slug, title: r.title, isHome: r.isHome, parentSlug: r.parentSlug }));

    const res = await fetch(`/api/sites/${siteId}/import/sitemap/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to import.");
      return;
    }
    onImported(
      (data.created as { id: string; slug: string; title: string; isHome: boolean }[]).map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        isHome: p.isHome,
        collectionId: null,
      })),
    );
    setOpen(false);
    reset();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
      >
        Import pages from existing site
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setOpen(false);
            reset();
          }}
        >
          <div
            className="max-h-[85vh] w-[640px] overflow-y-auto rounded bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Import pages from existing site</h2>
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="text-sm text-gray-500"
              >
                Close
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              One-time action: this creates empty page shells from an existing site&apos;s URL structure. It does
              not stay linked to the source — there is no re-sync. Page text is migrated separately, per page,
              using the editor&apos;s Content clipboard.
            </p>

            {!rows && (
              <form onSubmit={handleParse} className="mt-4 flex flex-col gap-3">
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-1">
                    <input type="radio" checked={method === "sitemapUrl"} onChange={() => setMethod("sitemapUrl")} />
                    Sitemap URL
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" checked={method === "file"} onChange={() => setMethod("file")} />
                    Upload sitemap file
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" checked={method === "rootUrl"} onChange={() => setMethod("rootUrl")} />
                    Crawl from root URL
                  </label>
                </div>
                {method === "file" ? (
                  <input
                    type="file"
                    accept=".xml,text/xml,application/xml"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="text-sm"
                  />
                ) : (
                  <input
                    type="url"
                    required
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    placeholder={method === "sitemapUrl" ? "https://old-site.com/sitemap.xml" : "https://old-site.com/"}
                    className="rounded border px-3 py-2 text-sm"
                  />
                )}
                {method === "rootUrl" && (
                  <p className="text-xs text-gray-500">
                    Falls back to crawling same-origin links from this page if no sitemap is reachable at
                    /sitemap.xml. Lower quality — coverage isn&apos;t guaranteed.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || (method === "file" ? !file : !urlValue.trim())}
                  className="w-fit rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  {loading ? "Parsing..." : "Parse"}
                </button>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </form>
            )}

            {rows && (
              <div className="mt-4">
                {source === "crawl" && (
                  <p className="mb-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
                    Crawled, not from a sitemap — this list may be incomplete.
                  </p>
                )}
                <ul className="divide-y">
                  {rows.map((row, i) => {
                    const collision = existing.has(row.suggestedSlug);
                    return (
                      <li key={`${row.suggestedSlug}-${i}`} className="flex items-center gap-2 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(e) => updateRow(i, { selected: e.target.checked })}
                        />
                        <span style={{ paddingLeft: `${row.depth * 12}px` }} className="w-40 truncate text-gray-500">
                          {row.suggestedSlug || "/"}
                        </span>
                        <input
                          value={row.title}
                          onChange={(e) => updateRow(i, { title: e.target.value })}
                          className="w-32 rounded border px-1 py-0.5 text-xs"
                        />
                        <input
                          value={row.slug}
                          onChange={(e) => updateRow(i, { slug: e.target.value })}
                          className="w-32 rounded border px-1 py-0.5 text-xs"
                        />
                        {collision && (
                          <span className="text-xs text-red-600">
                            Slug already exists — edit above or leave unchecked (will be skipped).
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleCommit}
                    disabled={loading || rows.every((r) => !r.selected)}
                    className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {loading ? "Importing..." : `Import ${rows.filter((r) => r.selected).length} pages`}
                  </button>
                  <button onClick={reset} className="text-sm text-gray-500 underline">
                    Start over
                  </button>
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
