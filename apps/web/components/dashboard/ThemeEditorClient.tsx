"use client";

import { useMemo, useState } from "react";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { Block } from "@/components/blocks/types";
import type { ThemeTokens, TokenCategory } from "@/lib/theme";

const CATEGORY_LABELS: Record<TokenCategory, string> = {
  colors: "Colors",
  typography: "Typography scale",
  spacing: "Spacing scale",
};

// Static block tree used only for the live preview panel; every style value
// is a token reference so editing tokens below re-renders it immediately
// through the same BlockRenderer + resolveTokens path the real editor uses.
function previewContent(): Block {
  return {
    id: "preview-root",
    type: "section",
    props: { layout: "stack" },
    style: { base: { padding: { $token: "spacing.lg" }, background: { $token: "colors.background" } } },
    children: [
      {
        id: "preview-heading",
        type: "heading",
        props: { level: "h2", text: "Heading preview" },
        style: { base: { fontSize: { $token: "typography.xl" }, color: { $token: "colors.text" } } },
      },
      {
        id: "preview-text",
        type: "text",
        props: { content: "Body text preview using the theme's base scale and text color." },
        style: { base: { fontSize: { $token: "typography.base" }, color: { $token: "colors.text" } } },
      },
      {
        id: "preview-button",
        type: "button",
        props: { label: "Primary action", href: "#", variant: "primary" },
        style: { base: {} },
      },
    ],
  };
}

export function ThemeEditorClient({ siteId, initialTokens }: { siteId: string; initialTokens: ThemeTokens }) {
  const [tokens, setTokens] = useState<ThemeTokens>(initialTokens);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const preview = useMemo(() => previewContent(), []);

  function setToken(category: TokenCategory, key: string, value: string) {
    setTokens((prev) => ({ ...prev, [category]: { ...prev[category], [key]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/sites/${siteId}/theme`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens }),
    });
    setSaving(false);
    if (res.ok) setSavedAt(Date.now());
  }

  return (
    <div className="mt-6 grid grid-cols-[1fr_360px] gap-8">
      <div className="flex flex-col gap-6">
        {(Object.keys(tokens) as TokenCategory[]).map((category) => (
          <div key={category} className="rounded border p-4">
            <h2 className="text-sm font-semibold">{CATEGORY_LABELS[category]}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {Object.entries(tokens[category]).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-gray-600">{key}</span>
                  {category === "colors" ? (
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
                      onChange={(e) => setToken(category, key, e.target.value)}
                      className="h-8 w-16 rounded border"
                    />
                  ) : null}
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setToken(category, key, e.target.value)}
                    className="w-40 rounded border px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save theme"}
          </button>
          {savedAt && <span className="text-xs text-gray-400">Saved</span>}
        </div>
      </div>
      <div>
        <h2 className="text-xs font-semibold uppercase text-gray-500">Live preview</h2>
        <div className="mt-2 rounded border bg-white shadow-sm">
          <BlockRenderer block={preview} theme={tokens} />
        </div>
      </div>
    </div>
  );
}
