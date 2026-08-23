"use client";

import { useState } from "react";
import type { AccordionItem } from "@/components/blocks/types";

function newItem(): AccordionItem {
  return { id: crypto.randomUUID(), question: "New question", answer: "Answer goes here." };
}

// FAQ item list management for the `accordion` block — add/remove/reorder
// question+answer rows. Rendered by Inspector.tsx instead of the generic
// FieldSchema loop, same reasoning as FormFieldsEditor: `items` is a list
// of structured records, not flat props.
export function AccordionItemsEditor({
  items,
  onChange,
  readOnly = false,
}: {
  items: AccordionItem[];
  onChange: (items: AccordionItem[]) => void;
  readOnly?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateItem(id: string, patch: Partial<AccordionItem>) {
    if (readOnly) return;
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    if (readOnly) return;
    onChange(items.filter((it) => it.id !== id));
  }

  function moveItem(id: string, dir: -1 | 1) {
    if (readOnly) return;
    const index = items.findIndex((it) => it.id === id);
    const target = index + dir;
    if (index === -1 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="chrome-label !mb-0">FAQ items</label>
        <button
          onClick={() => onChange([...items, newItem()])}
          disabled={readOnly}
          className="chrome-btn chrome-btn-secondary !py-1 text-xs"
        >
          + Add item
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={item.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] p-2">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="min-w-0 flex-1 truncate text-left text-xs font-medium text-[var(--text)]"
              >
                {item.question || "(untitled)"}
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => moveItem(item.id, -1)} disabled={i === 0 || readOnly} className="px-1 text-xs disabled:opacity-30">
                  ↑
                </button>
                <button
                  onClick={() => moveItem(item.id, 1)}
                  disabled={i === items.length - 1 || readOnly}
                  className="px-1 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button onClick={() => removeItem(item.id)} disabled={readOnly} className="px-1 text-xs text-red-600 disabled:opacity-30">
                  ✕
                </button>
              </div>
            </div>
            {expandedId === item.id && (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  value={item.question}
                  onChange={(e) => updateItem(item.id, { question: e.target.value })}
                  placeholder="Question"
                  disabled={readOnly}
                  className="chrome-input w-full text-xs"
                />
                <textarea
                  value={item.answer}
                  onChange={(e) => updateItem(item.id, { answer: e.target.value })}
                  placeholder="Answer"
                  rows={3}
                  disabled={readOnly}
                  className="chrome-input w-full text-xs"
                />
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-[var(--text-faint)]">No items yet.</p>}
      </div>
    </div>
  );
}
