"use client";

import type { Condition } from "@/lib/condition";

type CollectionOption = { id: string; name: string };

// Minimal condition editor: a single rule (not the full and/or nesting the
// `Condition` type allows) — enough to cover Theme Builder targeting and
// form-field `showIf` without a second condition UI (docs/forms.md: "the
// same condition-builder UI used elsewhere"). Controlled component — the
// caller owns persistence/debouncing.
export function ConditionEditor({
  condition,
  onChange,
  collections,
}: {
  condition: Condition;
  onChange: (next: Condition) => void;
  collections: CollectionOption[];
}) {
  function setType(type: Condition["type"]) {
    if (type === "always") onChange({ type: "always" });
    else if (type === "deviceIs") onChange({ type: "deviceIs", device: "desktop" });
    else if (type === "collectionFieldEquals") {
      onChange({ type: "collectionFieldEquals", collectionId: collections[0]?.id ?? "", field: "", value: "" });
    } else onChange({ type: "always" });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={condition.type}
        onChange={(e) => setType(e.target.value as Condition["type"])}
        className="rounded border px-2 py-1 text-xs"
      >
        <option value="always">Always</option>
        <option value="deviceIs">Device is...</option>
        <option value="collectionFieldEquals">Collection field equals...</option>
      </select>

      {condition.type === "deviceIs" && (
        <select
          value={condition.device}
          onChange={(e) => onChange({ type: "deviceIs", device: e.target.value as "desktop" | "tablet" | "mobile" })}
          className="rounded border px-2 py-1 text-xs"
        >
          <option value="desktop">Desktop</option>
          <option value="tablet">Tablet</option>
          <option value="mobile">Mobile</option>
        </select>
      )}

      {condition.type === "collectionFieldEquals" && (
        <>
          <select
            value={condition.collectionId}
            onChange={(e) => onChange({ ...condition, collectionId: e.target.value })}
            className="rounded border px-2 py-1 text-xs"
          >
            <option value="">Select a collection...</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={condition.field}
            onChange={(e) => onChange({ ...condition, field: e.target.value })}
            placeholder="field"
            className="w-24 rounded border px-2 py-1 text-xs"
          />
          <input
            value={String(condition.value ?? "")}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            placeholder="value"
            className="w-24 rounded border px-2 py-1 text-xs"
          />
        </>
      )}
    </div>
  );
}
