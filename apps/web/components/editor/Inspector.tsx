"use client";

import type { Block, FieldSchema } from "@/components/blocks/types";
import { blockRegistry } from "@/components/blocks/registry";

type InspectorProps = {
  block: Block | null;
  onChange: (group: "props" | "style", key: string, value: string) => void;
};

function FieldInput({ field, value, onChange }: { field: FieldSchema; value: string; onChange: (v: string) => void }) {
  if (field.input === "select") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border px-2 py-1 text-sm">
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
        className="h-8 w-full rounded border"
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border px-2 py-1 text-sm"
    />
  );
}

export function Inspector({ block, onChange }: InspectorProps) {
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
      <div className="mt-4 flex flex-col gap-4">
        {def.fields.map((field) => {
          const source = field.group === "style" ? block.style ?? {} : block.props;
          const raw = source[field.key];
          const value = typeof raw === "string" ? raw : "";
          return (
            <div key={`${field.group}.${field.key}`}>
              <label className="mb-1 block text-xs font-medium text-gray-600">{field.label}</label>
              <FieldInput field={field} value={value} onChange={(v) => onChange(field.group, field.key, v)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
