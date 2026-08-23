"use client";

import { useEffect, useRef, useState } from "react";
import { customFontCssName, customFontFaceCss } from "@/lib/customFonts";
import type { CustomFont } from "@/lib/siteSettings";

// docs/reference-sites-plan.md Tier 4: upload a WOFF/WOFF2/TTF/OTF and
// register it as a selectable font — a block's "Font" dropdown
// (components/editor/Inspector.tsx) merges these in alongside the five
// curated Google Fonts. Lives on the Theme page since a site's typography
// is otherwise entirely a Theme concern, even though this list is stored
// on SiteSettings rather than Theme.tokens (a flat token-value map has no
// natural slot for "a font file", see lib/theme.ts).
export function CustomFontsPanel({ siteId }: { siteId: string }) {
  const [fonts, setFonts] = useState<CustomFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function refresh() {
    fetch(`/api/sites/${siteId}/fonts`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CustomFont[]) => {
        setFonts(data);
        setLoading(false);
      });
  }

  useEffect(refresh, [siteId]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    if (!name.trim()) {
      setError("Give the font a name first.");
      return;
    }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name.trim());
    const res = await fetch(`/api/sites/${siteId}/fonts`, { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed.");
      return;
    }
    setName("");
    if (fileInput.current) fileInput.current.value = "";
    refresh();
  }

  async function handleDelete(fontId: string) {
    await fetch(`/api/sites/${siteId}/fonts/${fontId}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="rounded border p-4">
      <h2 className="text-sm font-semibold">Custom fonts</h2>
      <p className="mt-1 text-xs text-gray-500">
        Upload a WOFF2, WOFF, TTF, or OTF file — it shows up in every text/heading block&apos;s Font picker.
      </p>
      {fonts.length > 0 && <style dangerouslySetInnerHTML={{ __html: customFontFaceCss(fonts) }} />}

      <form onSubmit={handleUpload} className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Font name, e.g. Brand Display"
          className="rounded border px-2 py-1 text-sm"
        />
        <input ref={fileInput} type="file" accept=".woff2,.woff,.ttf,.otf" className="text-sm" />
        <button type="submit" disabled={uploading} className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50">
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex flex-col gap-2">
        {loading ? (
          <p className="text-xs text-gray-400">Loading...</p>
        ) : fonts.length === 0 ? (
          <p className="text-xs text-gray-400">No custom fonts yet.</p>
        ) : (
          fonts.map((font) => (
            <div key={font.id} className="flex items-center justify-between rounded border px-3 py-2">
              <span style={{ fontFamily: `"${customFontCssName(font.id)}", sans-serif` }} className="text-lg">
                {font.name}
              </span>
              <button onClick={() => handleDelete(font.id)} className="text-xs text-red-600 hover:underline">
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
