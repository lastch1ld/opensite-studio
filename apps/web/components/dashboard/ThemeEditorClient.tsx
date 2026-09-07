"use client";

import { useMemo, useState } from "react";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { Block } from "@/components/blocks/types";
import type { ThemeTokens, TokenCategory } from "@/lib/theme";
import { THEME_PRESETS } from "@/lib/themePresets";

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
        <div className="chrome-card p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">Start from a preset</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Replaces the token values below. Nothing is saved until you press Save theme.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTokens(preset.tokens)}
                title={preset.description}
                className="chrome-btn chrome-btn-secondary flex items-center gap-2"
              >
                <span className="flex">
                  {["background", "text", "primary"].map((key) => (
                    <span
                      key={key}
                      className="-ml-1 h-4 w-4 rounded-full border border-[var(--border-strong)] first:ml-0"
                      style={{ background: preset.tokens.colors[key] }}
                    />
                  ))}
                </span>
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {(Object.keys(tokens) as TokenCategory[]).map((category) => (
          <div key={category} className="chrome-card p-4">
            <h2 className="text-sm font-semibold text-[var(--text)]">{CATEGORY_LABELS[category]}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {Object.entries(tokens[category]).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-[var(--text-muted)]">{key}</span>
                  {category === "colors" ? (
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
                      onChange={(e) => setToken(category, key, e.target.value)}
                      className="h-8 w-16 rounded-[var(--radius-sm)] border border-[var(--border)]"
                    />
                  ) : null}
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setToken(category, key, e.target.value)}
                    className="chrome-input w-40"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="chrome-btn chrome-btn-primary">
            {saving ? "Saving…" : "Save theme"}
          </button>
          {savedAt && <span className="text-xs text-[var(--text-faint)]">Saved</span>}
        </div>
      </div>
      <div>
        <h2 className="text-xs font-semibold uppercase text-[var(--text-muted)]">Live preview</h2>
        <div className="chrome-card mt-2 overflow-hidden">
          <BlockRenderer block={preview} theme={tokens} />
        </div>
      </div>
    </div>
  );
}
