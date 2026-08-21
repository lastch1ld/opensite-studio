"use client";

import { useState } from "react";
import type { Block, Breakpoint, FieldSchema } from "@/components/blocks/types";
import { blockRegistry } from "@/components/blocks/registry";
import { tokenOptionsFor, type ThemeTokens } from "@/lib/theme";
import type { CollectionSummary } from "./EditorClient";
import { MediaPicker } from "./MediaPicker";
import { FormFieldsEditor } from "./FormFieldsEditor";
import type { FormField, FormOnSubmit } from "@/components/blocks/types";

type InspectorProps = {
  block: Block | null;
  siteId: string;
  activeBreakpoint: Breakpoint;
  theme: ThemeTokens | null;
  onChange: (group: "props" | "style", key: string, value: unknown) => void;
  collections?: CollectionSummary[];
  pageCollectionId?: string | null;
  readOnly?: boolean;
};

function isTokenRef(v: unknown): v is { $token: string } {
  return typeof v === "object" && v !== null && typeof (v as { $token?: unknown }).$token === "string";
}

function isBindRef(v: unknown): v is { $bind: { source: string; collectionId?: string; field: string } } {
  return typeof v === "object" && v !== null && typeof (v as { $bind?: unknown }).$bind === "object";
}

function FieldInput({
  field,
  value,
  onChange,
  onOpenMediaPicker,
  collections,
  readOnly = false,
}: {
  field: FieldSchema;
  value: string;
  onChange: (v: string) => void;
  onOpenMediaPicker: () => void;
  collections: CollectionSummary[];
  readOnly?: boolean;
}) {
  if (field.input === "collectionSelect") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-full rounded border px-2 py-1 text-sm"
      >
        <option value="">Select a collection...</option>
        {collections.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    );
  }
  if (field.input === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-full rounded border px-2 py-1 text-sm"
      >
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.input === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        rows={3}
        className="w-full rounded border px-2 py-1 text-sm"
      />
    );
  }
  if (field.input === "color") {
    return (
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="h-8 w-full rounded border"
      />
    );
  }
  if (field.input === "image") {
    return (
      <div className="flex flex-col gap-2">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-24 w-full rounded border object-cover" />
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            className="w-full rounded border px-2 py-1 text-sm"
          />
          <button
            onClick={onOpenMediaPicker}
            disabled={readOnly}
            className="whitespace-nowrap rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
          >
            Choose
          </button>
        </div>
      </div>
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={readOnly}
      className="w-full rounded border px-2 py-1 text-sm"
    />
  );
}

// Shown when a bindable field's literal input is toggled to a `$bind`
// reference (docs/collections.md's editor UX: "a toggle, not a separate
// mode"). `currentItem` (used when this page is itself bound to a
// Collection, i.e. it's the per-item template) only needs a field key;
// `collection` also needs which Collection to pull from.
function BindEditor({
  boundRef,
  collections,
  pageCollectionId,
  onChange,
  readOnly = false,
}: {
  boundRef: { source: string; collectionId?: string; field: string };
  collections: CollectionSummary[];
  pageCollectionId?: string | null;
  onChange: (next: { source: string; collectionId?: string; field: string }) => void;
  readOnly?: boolean;
}) {
  const isCurrentItem = boundRef.source === "currentItem";
  const targetCollection = isCurrentItem
    ? collections.find((c) => c.id === pageCollectionId)
    : collections.find((c) => c.id === boundRef.collectionId);

  return (
    <div className="flex flex-col gap-1 rounded border border-dashed border-blue-300 bg-blue-50 p-2">
      {!isCurrentItem && (
        <select
          value={boundRef.collectionId ?? ""}
          onChange={(e) => onChange({ ...boundRef, collectionId: e.target.value })}
          disabled={readOnly}
          className="w-full rounded border px-2 py-1 text-xs"
        >
          <option value="">Select a collection...</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      <select
        value={boundRef.field}
        onChange={(e) => onChange({ ...boundRef, field: e.target.value })}
        disabled={readOnly}
        className="w-full rounded border px-2 py-1 text-xs"
      >
        <option value="">Select a field...</option>
        {targetCollection?.fieldSchema.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label} ({f.key})
          </option>
        ))}
      </select>
    </div>
  );
}

export function Inspector({
  block,
  siteId,
  activeBreakpoint,
  theme,
  onChange,
  collections = [],
  pageCollectionId = null,
  readOnly = false,
}: InspectorProps) {
  const [mediaFieldKey, setMediaFieldKey] = useState<string | null>(null);

  if (!block) {
    return (
      <div className="h-full border-l bg-white p-4">
        <h2 className="text-xs font-semibold uppercase text-gray-500">Inspector</h2>
        <p className="mt-4 text-sm text-gray-500">Select a block to edit its properties.</p>
      </div>
    );
  }

  const def = blockRegistry[block.type];

  return (
    <div className="h-full overflow-y-auto border-l bg-white p-4">
      <h2 className="text-xs font-semibold uppercase text-gray-500">{def.label}</h2>
      {activeBreakpoint !== "base" && (
        <p className="mt-1 text-xs text-amber-600">
          Editing style overrides for {activeBreakpoint}. Leave a field blank to inherit desktop.
        </p>
      )}
      {block.type === "form" && (
        <div className="mt-4">
          <FormFieldsEditor
            fields={Array.isArray(block.props.fields) ? (block.props.fields as FormField[]) : []}
            submitLabel={typeof block.props.submitLabel === "string" ? block.props.submitLabel : "Submit"}
            onSubmit={(block.props.onSubmit as FormOnSubmit | undefined) ?? { action: "storeOnly" }}
            collections={collections}
            onChange={(next) => {
              if (next.fields !== undefined) onChange("props", "fields", next.fields);
              if (next.submitLabel !== undefined) onChange("props", "submitLabel", next.submitLabel);
              if (next.onSubmit !== undefined) onChange("props", "onSubmit", next.onSubmit);
            }}
            readOnly={readOnly}
          />
        </div>
      )}
      <div className="mt-4 flex flex-col gap-4">
        {block.type !== "form" && def.fields.map((field) => {
          const isStyle = field.group === "style";
          // Props are global (not breakpoint-scoped); style edits write into
          // the currently active breakpoint's override bucket.
          const source = isStyle ? block.style?.[activeBreakpoint] ?? {} : block.props;
          const raw = source[field.key];
          const tokenRef = isTokenRef(raw) ? raw.$token : null;
          const boundRef = isBindRef(raw) ? raw.$bind : null;
          const value = typeof raw === "string" ? raw : "";
          const tokenOptions = field.tokenCategory && theme ? tokenOptionsFor(theme, field.tokenCategory) : [];
          const bindable = field.bindable && collections.length > 0;
          return (
            <div key={`${field.group}.${field.key}`}>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-medium text-gray-600">{field.label}</label>
                {bindable && (
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={Boolean(boundRef)}
                      disabled={readOnly}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          onChange(field.group, field.key, "");
                          return;
                        }
                        const useCurrentItem = Boolean(pageCollectionId);
                        onChange(
                          field.group,
                          field.key,
                          useCurrentItem
                            ? { $bind: { source: "currentItem", field: "" } }
                            : { $bind: { source: "collection", collectionId: collections[0]?.id ?? "", field: "" } },
                        );
                      }}
                    />
                    Bind
                  </label>
                )}
              </div>
              {boundRef && (
                <BindEditor
                  boundRef={boundRef}
                  collections={collections}
                  pageCollectionId={pageCollectionId}
                  onChange={(next) => onChange(field.group, field.key, { $bind: next })}
                  readOnly={readOnly}
                />
              )}
              {!boundRef && tokenOptions.length > 0 && (
                <select
                  value={tokenRef ?? "__custom__"}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") onChange(field.group, field.key, value);
                    else onChange(field.group, field.key, { $token: e.target.value });
                  }}
                  disabled={readOnly}
                  className="mb-1 w-full rounded border px-2 py-1 text-xs"
                >
                  <option value="__custom__">Custom value</option>
                  {tokenOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Token: {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {!tokenRef && !boundRef && (
                <FieldInput
                  field={field}
                  value={value}
                  onChange={(v) => onChange(field.group, field.key, v)}
                  onOpenMediaPicker={() => setMediaFieldKey(field.key)}
                  collections={collections}
                  readOnly={readOnly}
                />
              )}
            </div>
          );
        })}
      </div>
      {mediaFieldKey && (
        <MediaPicker
          siteId={siteId}
          onClose={() => setMediaFieldKey(null)}
          onSelect={(url) => {
            onChange("props", mediaFieldKey, url);
            setMediaFieldKey(null);
          }}
        />
      )}
    </div>
  );
}
