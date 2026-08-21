"use client";

import { useState } from "react";
import type { Condition } from "@/lib/condition";

type CollectionOption = { id: string; name: string };

// Minimal condition editor: a single rule (not the full and/or nesting the
// `Condition` type allows) plus priority — enough to prove Theme Builder's
// targeting mechanism end-to-end without building a full rules-builder UI.
export function TemplateTargetingPanel({
  siteId,
  templateId,
  initialCondition,
  initialPriority,
  collections,
  readOnly = false,
}: {
  siteId: string;
  templateId: string;
  initialCondition: Condition;
  initialPriority: number;
  collections: CollectionOption[];
  readOnly?: boolean;
}) {
  const [condition, setCondition] = useState<Condition>(initialCondition);
  const [priority, setPriority] = useState(initialPriority);
  const [saving, setSaving] = useState(false);

  async function save(nextCondition: Condition, nextPriority: number) {
    if (readOnly) return;
    const prevCondition = condition;
    const prevPriority = priority;
    setSaving(true);
    const res = await fetch(`/api/sites/${siteId}/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition: nextCondition, priority: nextPriority }),
    });
    if (!res.ok) {
      setCondition(prevCondition);
      setPriority(prevPriority);
      window.alert("Failed to save targeting condition.");
    }
    setSaving(false);
  }

  function setType(type: Condition["type"]) {
    if (readOnly) return;
    let next: Condition;
    if (type === "always") next = { type: "always" };
    else if (type === "deviceIs") next = { type: "deviceIs", device: "desktop" };
    else if (type === "collectionFieldEquals") {
      next = { type: "collectionFieldEquals", collectionId: collections[0]?.id ?? "", field: "", value: "" };
    } else next = { type: "always" };
    setCondition(next);
    save(next, priority);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-t px-4 py-2">
      <span className="text-xs font-medium text-gray-500">Applies when:</span>
      <select
        value={condition.type}
        onChange={(e) => setType(e.target.value as Condition["type"])}
        disabled={readOnly}
        className="rounded border px-2 py-1 text-xs"
      >
        <option value="always">Always</option>
        <option value="deviceIs">Device is...</option>
        <option value="collectionFieldEquals">Collection field equals...</option>
      </select>

      {condition.type === "deviceIs" && (
        <select
          value={condition.device}
          onChange={(e) => {
            const next: Condition = { type: "deviceIs", device: e.target.value as "desktop" | "tablet" | "mobile" };
            setCondition(next);
            save(next, priority);
          }}
          disabled={readOnly}
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
            onChange={(e) => {
              const next: Condition = { ...condition, collectionId: e.target.value };
              setCondition(next);
              save(next, priority);
            }}
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
            value={condition.field}
            onChange={(e) => {
              const next: Condition = { ...condition, field: e.target.value };
              setCondition(next);
            }}
            onBlur={() => save(condition, priority)}
            placeholder="field"
            disabled={readOnly}
            className="w-24 rounded border px-2 py-1 text-xs"
          />
          <input
            value={String(condition.value ?? "")}
            onChange={(e) => {
              const next: Condition = { ...condition, value: e.target.value };
              setCondition(next);
            }}
            onBlur={() => save(condition, priority)}
            placeholder="value"
            disabled={readOnly}
            className="w-24 rounded border px-2 py-1 text-xs"
          />
        </>
      )}

      <span className="text-xs font-medium text-gray-500">Priority:</span>
      <input
        type="number"
        value={priority}
        onChange={(e) => setPriority(Number(e.target.value))}
        onBlur={() => save(condition, priority)}
        disabled={readOnly}
        className="w-16 rounded border px-2 py-1 text-xs"
      />
      {saving && <span className="text-xs text-gray-400">Saving...</span>}
    </div>
  );
}
