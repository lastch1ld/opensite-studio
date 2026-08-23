"use client";

import { useState } from "react";

export type LocaleRow = { id: string; code: string; label: string; isDefault: boolean };

// docs/multilingual.md item 5: minimal Site Settings UI for managing
// Locales — deliberately plain (no drag-reorder, no inline validation
// beyond what the API already enforces) since the data layer + resolution
// engine + public routing are what matter most for correctness in this
// pass; this panel just needs to make Locale rows creatable/editable so
// there's something for the editor's locale switcher to list.
export function LocalesPanel({
  siteId,
  initialLocales,
  defaultLocalePrefixed: initialDefaultLocalePrefixed,
  readOnly,
}: {
  siteId: string;
  initialLocales: LocaleRow[];
  defaultLocalePrefixed: boolean;
  readOnly: boolean;
}) {
  const [locales, setLocales] = useState<LocaleRow[]>(initialLocales);
  const [defaultLocalePrefixed, setDefaultLocalePrefixed] = useState(initialDefaultLocalePrefixed);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const res = await fetch(`/api/sites/${siteId}/locales`);
    if (res.ok) setLocales(await res.json());
  }

  async function addLocale() {
    if (!code.trim() || !label.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/sites/${siteId}/locales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim(), label: label.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to add locale");
    } else {
      setCode("");
      setLabel("");
      await refresh();
    }
    setSaving(false);
  }

  async function setDefault(localeId: string) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/sites/${siteId}/locales/${localeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) await refresh();
    else setError((await res.json()).error ?? "Failed to set default locale");
    setSaving(false);
  }

  async function removeLocale(localeId: string) {
    if (!confirm("Delete this locale? Its translations will be deleted too.")) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/sites/${siteId}/locales/${localeId}`, { method: "DELETE" });
    if (res.ok) await refresh();
    else setError((await res.json()).error ?? "Failed to delete locale");
    setSaving(false);
  }

  async function togglePrefixed(checked: boolean) {
    setDefaultLocalePrefixed(checked);
    await fetch(`/api/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultLocalePrefixed: checked }),
    });
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-700">Locales</h2>
      <p className="mt-1 text-xs text-gray-500">
        Configure which languages this site supports. Content is authored once in the default locale; every other
        locale holds per-field overrides on top of it (docs/multilingual.md).
      </p>
      <div className="mt-3 flex flex-col gap-3 rounded border p-4">
        {locales.length === 0 && <p className="text-sm text-gray-500">No locales configured — this site renders unprefixed, single-language.</p>}
        {locales.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
            <span>
              {l.label} <span className="text-gray-400">({l.code})</span>
              {l.isDefault && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">default</span>}
            </span>
            {!readOnly && (
              <div className="flex gap-2">
                {!l.isDefault && (
                  <button onClick={() => setDefault(l.id)} disabled={saving} className="text-xs text-gray-500 underline disabled:opacity-50">
                    Make default
                  </button>
                )}
                <button onClick={() => removeLocale(l.id)} disabled={saving} className="text-xs text-red-600 underline disabled:opacity-50">
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        {!readOnly && (
          <div className="flex items-end gap-2 border-t pt-3">
            <label className="flex flex-col gap-1 text-xs text-gray-500">
              Code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="de-DE"
                className="w-28 rounded border px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-gray-500">
              Label
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="German"
                className="w-40 rounded border px-2 py-1 text-sm"
              />
            </label>
            <button
              onClick={addLocale}
              disabled={saving || !code.trim() || !label.trim()}
              className="rounded border px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
            >
              Add locale
            </button>
          </div>
        )}
        {locales.length > 0 && (
          <label className="flex items-center gap-2 border-t pt-3 text-sm">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={defaultLocalePrefixed}
              onChange={(e) => togglePrefixed(e.target.checked)}
            />
            Prefix the default locale&rsquo;s URLs too (e.g. <code>/en/about</code> instead of <code>/about</code>)
          </label>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </section>
  );
}
