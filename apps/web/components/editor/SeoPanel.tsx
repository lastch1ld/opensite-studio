"use client";

import type { PageSeo } from "@/lib/seo";

// Per-page SEO fields (docs/integrations.md "SEO") — a dedicated right-panel
// tab rather than the generic block Inspector, since these are page-level,
// not block-level, fields.
export function SeoPanel({
  seo,
  onChange,
  readOnly,
}: {
  seo: PageSeo;
  onChange: (next: PageSeo) => void;
  readOnly: boolean;
}) {
  function set<K extends keyof PageSeo>(key: K, value: PageSeo[K]) {
    if (readOnly) return;
    onChange({ ...seo, [key]: value });
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto border-l bg-white p-4">
      <h2 className="text-xs font-semibold uppercase text-gray-500">SEO</h2>

      <label className="flex flex-col gap-1 text-xs text-gray-600">
        Meta title
        <input
          type="text"
          disabled={readOnly}
          value={seo.metaTitle ?? ""}
          onChange={(e) => set("metaTitle", e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-gray-600">
        Meta description
        <textarea
          disabled={readOnly}
          value={seo.metaDescription ?? ""}
          onChange={(e) => set("metaDescription", e.target.value)}
          rows={3}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-gray-600">
        Canonical URL
        <input
          type="url"
          disabled={readOnly}
          value={seo.canonicalUrl ?? ""}
          onChange={(e) => set("canonicalUrl", e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </label>

      <hr />

      <label className="flex flex-col gap-1 text-xs text-gray-600">
        OG title
        <input
          type="text"
          disabled={readOnly}
          value={seo.ogTitle ?? ""}
          onChange={(e) => set("ogTitle", e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-gray-600">
        OG description
        <textarea
          disabled={readOnly}
          value={seo.ogDescription ?? ""}
          onChange={(e) => set("ogDescription", e.target.value)}
          rows={2}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-gray-600">
        OG image URL
        <input
          type="url"
          disabled={readOnly}
          value={seo.ogImage ?? ""}
          onChange={(e) => set("ogImage", e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-gray-600">
        Twitter card type
        <select
          disabled={readOnly}
          value={seo.twitterCard ?? "summary"}
          onChange={(e) => set("twitterCard", e.target.value as PageSeo["twitterCard"])}
          className="w-full rounded border px-2 py-1 text-sm"
        >
          <option value="summary">Summary</option>
          <option value="summary_large_image">Summary with large image</option>
        </select>
      </label>

      <hr />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={readOnly}
          checked={seo.robotsIndex !== false}
          onChange={(e) => set("robotsIndex", e.target.checked)}
        />
        Allow search engines to index this page
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={readOnly}
          checked={seo.robotsFollow !== false}
          onChange={(e) => set("robotsFollow", e.target.checked)}
        />
        Allow search engines to follow links on this page
      </label>
    </div>
  );
}
