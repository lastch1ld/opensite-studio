"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CollectionField } from "@/lib/collectionSchema";

type Item = { id: string; data: Record<string, unknown> };

const FIELD_TYPES: CollectionField["type"][] = ["text", "richText", "number", "boolean", "date", "image", "reference"];

function fieldInputValue(field: CollectionField, value: unknown): string {
  if (field.type === "boolean") return value ? "true" : "false";
  return value === undefined || value === null ? "" : String(value);
}

function parseFieldValue(field: CollectionField, raw: string): unknown {
  if (field.type === "number") return raw === "" ? null : Number(raw);
  if (field.type === "boolean") return raw === "true";
  return raw;
}

export function CollectionEditorClient({
  siteId,
  collectionId,
  initialName,
  initialFieldSchema,
  initialItems,
}: {
  siteId: string;
  collectionId: string;
  initialName: string;
  initialFieldSchema: CollectionField[];
  initialItems: Item[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [fieldSchema, setFieldSchema] = useState<CollectionField[]>(initialFieldSchema);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [savingSchema, setSavingSchema] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function saveSchema(nextName: string, nextSchema: CollectionField[]) {
    setSavingSchema(true);
    await fetch(`/api/sites/${siteId}/collections/${collectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName, fieldSchema: nextSchema }),
    });
    setSavingSchema(false);
    router.refresh();
  }

  function addField() {
    const next = [...fieldSchema, { key: `field${fieldSchema.length + 1}`, label: "New field", type: "text" as const }];
    setFieldSchema(next);
    saveSchema(name, next);
  }

  function updateField(index: number, patch: Partial<CollectionField>) {
    const next = fieldSchema.map((f, i) => (i === index ? { ...f, ...patch } : f));
    setFieldSchema(next);
    saveSchema(name, next);
  }

  function removeField(index: number) {
    const next = fieldSchema.filter((_, i) => i !== index);
    setFieldSchema(next);
    saveSchema(name, next);
  }

  async function addItem() {
    const data: Record<string, unknown> = {};
    for (const field of fieldSchema) data[field.key] = field.type === "boolean" ? false : "";
    const res = await fetch(`/api/sites/${siteId}/collections/${collectionId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [...prev, item]);
      router.refresh();
    }
  }

  async function updateItem(itemId: string, key: string, value: unknown) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const data = { ...item.data, [key]: value };
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, data } : i)));
    await fetch(`/api/sites/${siteId}/collections/${collectionId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/sites/${siteId}/collections/${collectionId}/items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      router.refresh();
    }
  }

  function toggleSelected(itemId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === items.length ? new Set() : new Set(items.map((i) => i.id))));
  }

  // No bulk-delete API — the existing per-item DELETE route already
  // exists and this is a "quick win," not new server surface; fired
  // concurrently rather than one at a time.
  async function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} item${ids.length === 1 ? "" : "s"}?`)) return;
    await Promise.all(ids.map((id) => fetch(`/api/sites/${siteId}/collections/${collectionId}/items/${id}`, { method: "DELETE" })));
    setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      <div className="rounded border p-4">
        <label className="block text-xs font-semibold uppercase text-gray-500">Collection name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => saveSchema(name, fieldSchema)}
          className="mt-1 rounded border px-3 py-2"
        />
      </div>

      <div className="rounded border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Fields</h2>
          <button onClick={addField} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">
            + Add field
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {fieldSchema.map((field, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={field.key}
                onChange={(e) => updateField(i, { key: e.target.value })}
                placeholder="key"
                className="w-32 rounded border px-2 py-1 text-sm"
              />
              <input
                value={field.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
                placeholder="Label"
                className="w-40 rounded border px-2 py-1 text-sm"
              />
              <select
                value={field.type}
                onChange={(e) => updateField(i, { type: e.target.value as CollectionField["type"] })}
                className="rounded border px-2 py-1 text-sm"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-gray-500" title="Per-locale override (docs/multilingual.md) — off means this field is shared across every locale">
                <input
                  type="checkbox"
                  checked={Boolean(field.translatable)}
                  onChange={(e) => updateField(i, { translatable: e.target.checked })}
                />
                Translatable
              </label>
              <button onClick={() => removeField(i)} className="text-sm text-red-600 underline">
                Remove
              </button>
            </div>
          ))}
          {fieldSchema.length === 0 && <p className="text-sm text-gray-500">No fields yet. Add one above.</p>}
        </div>
        {savingSchema && <p className="mt-2 text-xs text-gray-400">Saving...</p>}
      </div>

      <div className="rounded border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Items</h2>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button onClick={deleteSelected} className="rounded border border-red-600 px-3 py-1 text-xs text-red-600 hover:bg-red-50">
                Delete {selectedIds.size} selected
              </button>
            )}
            <button
              onClick={addItem}
              disabled={fieldSchema.length === 0}
              className="rounded bg-black px-3 py-1 text-xs text-white disabled:opacity-50"
            >
              + Add item
            </button>
          </div>
        </div>
        {fieldSchema.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Add fields before adding items.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500">
                  <th className="p-2">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedIds.size === items.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all items"
                    />
                  </th>
                  {fieldSchema.map((field) => (
                    <th key={field.key} className="p-2">
                      {field.label}
                    </th>
                  ))}
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelected(item.id)}
                        aria-label={`Select item ${item.id}`}
                      />
                    </td>
                    {fieldSchema.map((field) => (
                      <td key={field.key} className="p-2">
                        {field.type === "boolean" ? (
                          <input
                            type="checkbox"
                            checked={Boolean(item.data[field.key])}
                            onChange={(e) => updateItem(item.id, field.key, e.target.checked)}
                          />
                        ) : (
                          <input
                            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                            value={fieldInputValue(field, item.data[field.key])}
                            onChange={(e) => updateItem(item.id, field.key, parseFieldValue(field, e.target.value))}
                            className="w-full rounded border px-2 py-1"
                          />
                        )}
                      </td>
                    ))}
                    <td className="p-2">
                      <button onClick={() => deleteItem(item.id)} className="text-red-600 underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && <p className="mt-3 text-sm text-gray-500">No items yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
