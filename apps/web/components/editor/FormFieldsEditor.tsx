"use client";

import { useState } from "react";
import type { FormField, FormOnSubmit } from "@/components/blocks/types";
import type { Condition } from "@/lib/condition";
import { ConditionEditor } from "@/components/shared/ConditionEditor";

type CollectionOption = { id: string; name: string };

const FIELD_TYPES: FormField["type"][] = ["text", "email", "textarea", "select", "checkbox", "radio", "file"];

function newField(): FormField {
  return { id: crypto.randomUUID(), type: "text", label: "New field", required: false };
}

// Field list management for the `form` block — add/remove/reorder fields,
// edit each field's config including its `showIf` condition (via the same
// shared ConditionEditor Theme Builder targeting uses), plus the block-level
// submitLabel/onSubmit config. Rendered by Inspector.tsx instead of the
// generic FieldSchema loop, since `fields` is a list of structured records
// rather than flat props (docs/forms.md).
export function FormFieldsEditor({
  fields,
  submitLabel,
  onSubmit,
  collections,
  onChange,
  readOnly = false,
}: {
  fields: FormField[];
  submitLabel: string;
  onSubmit: FormOnSubmit;
  collections: CollectionOption[];
  onChange: (next: { fields?: FormField[]; submitLabel?: string; onSubmit?: FormOnSubmit }) => void;
  readOnly?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateField(id: string, patch: Partial<FormField>) {
    if (readOnly) return;
    onChange({ fields: fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  }

  function removeField(id: string) {
    if (readOnly) return;
    onChange({ fields: fields.filter((f) => f.id !== id) });
  }

  function moveField(id: string, dir: -1 | 1) {
    if (readOnly) return;
    const index = fields.findIndex((f) => f.id === id);
    const target = index + dir;
    if (index === -1 || target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ fields: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Submit button label</label>
        <input
          value={submitLabel}
          onChange={(e) => onChange({ submitLabel: e.target.value })}
          disabled={readOnly}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">On submit</label>
        <select
          value={onSubmit.action}
          onChange={(e) => {
            const action = e.target.value as FormOnSubmit["action"];
            if (action === "webhook") onChange({ onSubmit: { action: "webhook", url: "" } });
            else if (action === "email") onChange({ onSubmit: { action: "email", to: "" } });
            else onChange({ onSubmit: { action: "storeOnly" } });
          }}
          disabled={readOnly}
          className="w-full rounded border px-2 py-1 text-sm"
        >
          <option value="storeOnly">Store only</option>
          <option value="webhook">Send to webhook URL</option>
          <option value="email">Notify by email (no SMTP configured yet — logged only)</option>
        </select>
        {onSubmit.action === "webhook" && (
          <input
            value={onSubmit.url}
            onChange={(e) => onChange({ onSubmit: { action: "webhook", url: e.target.value } })}
            placeholder="https://example.com/hook"
            disabled={readOnly}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
          />
        )}
        {onSubmit.action === "email" && (
          <input
            value={onSubmit.to}
            onChange={(e) => onChange({ onSubmit: { action: "email", to: e.target.value } })}
            placeholder="you@example.com"
            disabled={readOnly}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600">Fields</label>
        <button
          onClick={() => onChange({ fields: [...fields, newField()] })}
          disabled={readOnly}
          className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
        >
          + Add field
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {fields.map((field, i) => (
          <div key={field.id} className="rounded border p-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpandedId(expandedId === field.id ? null : field.id)}
                className="text-left text-xs font-medium"
              >
                {field.label || "(untitled)"} <span className="text-gray-400">({field.type})</span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveField(field.id, -1)}
                  disabled={i === 0 || readOnly}
                  className="px-1 text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveField(field.id, 1)}
                  disabled={i === fields.length - 1 || readOnly}
                  className="px-1 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button onClick={() => removeField(field.id)} disabled={readOnly} className="px-1 text-xs text-red-600 disabled:opacity-30">
                  ✕
                </button>
              </div>
            </div>

            {expandedId === field.id && (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  placeholder="Label"
                  disabled={readOnly}
                  className="w-full rounded border px-2 py-1 text-xs"
                />
                <select
                  value={field.type}
                  onChange={(e) => updateField(field.id, { type: e.target.value as FormField["type"] })}
                  disabled={readOnly}
                  className="w-full rounded border px-2 py-1 text-xs"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    disabled={readOnly}
                  />
                  Required
                </label>
                {(field.type === "select" || field.type === "radio") && (
                  <input
                    value={(field.options ?? []).join(", ")}
                    onChange={(e) =>
                      updateField(field.id, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })
                    }
                    placeholder="Option A, Option B"
                    disabled={readOnly}
                    className="w-full rounded border px-2 py-1 text-xs"
                  />
                )}
                <div>
                  <label className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={Boolean(field.showIf)}
                      onChange={(e) => updateField(field.id, { showIf: e.target.checked ? { type: "always" } : undefined })}
                      disabled={readOnly}
                    />
                    Conditional (show only if...)
                  </label>
                  {field.showIf && (
                    <ConditionEditor
                      condition={field.showIf}
                      onChange={(next: Condition) => updateField(field.id, { showIf: next })}
                      collections={collections}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {fields.length === 0 && <p className="text-xs text-gray-400">No fields yet.</p>}
      </div>
    </div>
  );
}
