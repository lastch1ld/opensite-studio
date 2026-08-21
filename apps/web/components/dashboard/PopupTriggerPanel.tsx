"use client";

import { useState } from "react";
import type { PopupSettings, PopupTrigger, PopupFrequency } from "@/lib/popupTrigger";

type CollectionOption = { id: string; name: string };

// Trigger configuration for a Popup Template (docs/popups-and-modals.md):
// when it fires (separate from Template.condition, which is "which pages is
// it eligible on"), plus frequency control and close behavior. Lives in the
// Template's settings, not on any block inside it.
export function PopupTriggerPanel({
  siteId,
  templateId,
  initialSettings,
  collections,
  readOnly = false,
}: {
  siteId: string;
  templateId: string;
  initialSettings: PopupSettings;
  collections: CollectionOption[];
  readOnly?: boolean;
}) {
  const [settings, setSettings] = useState<PopupSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  async function save(next: PopupSettings) {
    if (readOnly) return;
    const prev = settings;
    setSettings(next);
    setSaving(true);
    const res = await fetch(`/api/sites/${siteId}/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: next }),
    });
    if (!res.ok) {
      setSettings(prev);
      window.alert("Failed to save popup trigger settings.");
    }
    setSaving(false);
  }

  function setTriggerType(type: PopupTrigger["type"]) {
    let trigger: PopupTrigger;
    if (type === "pageLoad") trigger = { type: "pageLoad", delaySeconds: 3 };
    else if (type === "scrollPercent") trigger = { type: "scrollPercent", percent: 50 };
    else if (type === "exitIntent") trigger = { type: "exitIntent" };
    else if (type === "elementClick") trigger = { type: "elementClick", blockId: "" };
    else trigger = { type: "collectionFieldEquals", collectionId: collections[0]?.id ?? "", field: "", value: "" };
    save({ ...settings, trigger });
  }

  function setFrequencyMode(mode: PopupFrequency["mode"]) {
    const frequency: PopupFrequency = mode === "onceEveryNDays" ? { mode, days: 7 } : { mode };
    save({ ...settings, frequency });
  }

  const { trigger, frequency } = settings;

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-gray-500">Trigger:</span>
        <select
          value={trigger.type}
          onChange={(e) => setTriggerType(e.target.value as PopupTrigger["type"])}
          disabled={readOnly}
          className="rounded border px-2 py-1 text-xs"
        >
          <option value="pageLoad">Page load (with delay)</option>
          <option value="scrollPercent">Scroll percentage</option>
          <option value="exitIntent">Exit intent</option>
          <option value="elementClick">Element click</option>
          <option value="collectionFieldEquals">Collection field equals...</option>
        </select>

        {trigger.type === "pageLoad" && (
          <input
            type="number"
            min={0}
            value={trigger.delaySeconds ?? 0}
            onChange={(e) => save({ ...settings, trigger: { type: "pageLoad", delaySeconds: Number(e.target.value) } })}
            disabled={readOnly}
            className="w-20 rounded border px-2 py-1 text-xs"
            title="Delay in seconds"
          />
        )}

        {trigger.type === "scrollPercent" && (
          <input
            type="number"
            min={0}
            max={100}
            value={trigger.percent}
            onChange={(e) => save({ ...settings, trigger: { type: "scrollPercent", percent: Number(e.target.value) } })}
            disabled={readOnly}
            className="w-20 rounded border px-2 py-1 text-xs"
            title="Scroll percent"
          />
        )}

        {trigger.type === "elementClick" && (
          <input
            value={trigger.blockId}
            onChange={(e) => save({ ...settings, trigger: { type: "elementClick", blockId: e.target.value } })}
            placeholder="Block id of the trigger button/link"
            disabled={readOnly}
            className="w-56 rounded border px-2 py-1 text-xs"
          />
        )}

        {trigger.type === "collectionFieldEquals" && (
          <>
            <select
              value={trigger.collectionId}
              onChange={(e) => save({ ...settings, trigger: { ...trigger, collectionId: e.target.value } })}
              disabled={readOnly}
              className="rounded border px-2 py-1 text-xs"
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={trigger.field}
              onChange={(e) => save({ ...settings, trigger: { ...trigger, field: e.target.value } })}
              placeholder="field"
              disabled={readOnly}
              className="w-24 rounded border px-2 py-1 text-xs"
            />
            <input
              value={String(trigger.value ?? "")}
              onChange={(e) => save({ ...settings, trigger: { ...trigger, value: e.target.value } })}
              placeholder="value"
              disabled={readOnly}
              className="w-24 rounded border px-2 py-1 text-xs"
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-gray-500">Don&apos;t show again:</span>
        <select
          value={frequency.mode}
          onChange={(e) => setFrequencyMode(e.target.value as PopupFrequency["mode"])}
          disabled={readOnly}
          className="rounded border px-2 py-1 text-xs"
        >
          <option value="everyTime">Every time it triggers</option>
          <option value="oncePerSession">Once per session</option>
          <option value="onceEveryNDays">Once every N days</option>
        </select>
        {frequency.mode === "onceEveryNDays" && (
          <input
            type="number"
            min={1}
            value={frequency.days}
            onChange={(e) => save({ ...settings, frequency: { mode: "onceEveryNDays", days: Number(e.target.value) } })}
            disabled={readOnly}
            className="w-16 rounded border px-2 py-1 text-xs"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <span className="text-xs font-medium text-gray-500">Close via:</span>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={settings.closeOnButton}
            onChange={(e) => save({ ...settings, closeOnButton: e.target.checked })}
            disabled={readOnly}
          />
          Close button
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={settings.closeOnOutsideClick}
            onChange={(e) => save({ ...settings, closeOnOutsideClick: e.target.checked })}
            disabled={readOnly}
          />
          Click outside
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={settings.closeOnEscape}
            onChange={(e) => save({ ...settings, closeOnEscape: e.target.checked })}
            disabled={readOnly}
          />
          Escape key
        </label>
        {saving && <span className="text-xs text-gray-400">Saving...</span>}
      </div>
    </div>
  );
}
