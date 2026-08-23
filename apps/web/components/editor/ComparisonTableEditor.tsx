"use client";

import type { ComparisonColumn, ComparisonRow } from "@/components/blocks/types";

function newColumn(): ComparisonColumn {
  return { id: crypto.randomUUID(), title: "New plan", highlighted: false };
}

function newRow(columnCount: number): ComparisonRow {
  return { id: crypto.randomUUID(), label: "New feature", cells: Array(columnCount).fill("") };
}

// Column + row management for the `comparisonTable` block. Managed
// together (not two independent editors) because a row's `cells` array
// must stay positionally aligned with `columns` — adding, removing, or
// reordering a column resyncs every row's cells to match. Rendered by
// Inspector.tsx instead of the generic FieldSchema loop, same reasoning as
// AccordionItemsEditor/PricingTiersEditor.
export function ComparisonTableEditor({
  columns,
  rows,
  onChange,
  readOnly = false,
}: {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  onChange: (next: { columns?: ComparisonColumn[]; rows?: ComparisonRow[] }) => void;
  readOnly?: boolean;
}) {
  function addColumn() {
    if (readOnly) return;
    onChange({
      columns: [...columns, newColumn()],
      rows: rows.map((r) => ({ ...r, cells: [...r.cells, ""] })),
    });
  }

  function removeColumn(id: string) {
    if (readOnly) return;
    const index = columns.findIndex((c) => c.id === id);
    if (index === -1) return;
    onChange({
      columns: columns.filter((c) => c.id !== id),
      rows: rows.map((r) => ({ ...r, cells: r.cells.filter((_, i) => i !== index) })),
    });
  }

  function updateColumn(id: string, patch: Partial<ComparisonColumn>) {
    if (readOnly) return;
    onChange({ columns: columns.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  }

  function moveColumn(id: string, dir: -1 | 1) {
    if (readOnly) return;
    const index = columns.findIndex((c) => c.id === id);
    const target = index + dir;
    if (index === -1 || target < 0 || target >= columns.length) return;
    const nextColumns = [...columns];
    [nextColumns[index], nextColumns[target]] = [nextColumns[target], nextColumns[index]];
    const nextRows = rows.map((r) => {
      const cells = [...r.cells];
      [cells[index], cells[target]] = [cells[target], cells[index]];
      return { ...r, cells };
    });
    onChange({ columns: nextColumns, rows: nextRows });
  }

  function addRow() {
    if (readOnly) return;
    onChange({ rows: [...rows, newRow(columns.length)] });
  }

  function removeRow(id: string) {
    if (readOnly) return;
    onChange({ rows: rows.filter((r) => r.id !== id) });
  }

  function updateRow(id: string, patch: Partial<ComparisonRow>) {
    if (readOnly) return;
    onChange({ rows: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }

  function moveRow(id: string, dir: -1 | 1) {
    if (readOnly) return;
    const index = rows.findIndex((r) => r.id === id);
    const target = index + dir;
    if (index === -1 || target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ rows: next });
  }

  function updateCell(rowId: string, columnIndex: number, value: string) {
    if (readOnly) return;
    onChange({
      rows: rows.map((r) => {
        if (r.id !== rowId) return r;
        const cells = [...r.cells];
        cells[columnIndex] = value;
        return { ...r, cells };
      }),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between">
          <label className="chrome-label !mb-0">Columns (plans)</label>
          <button onClick={addColumn} disabled={readOnly} className="chrome-btn chrome-btn-secondary !py-1 text-xs">
            + Add column
          </button>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {columns.map((col, i) => (
            <div key={col.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] p-2">
              <div className="flex items-center gap-2">
                <input
                  value={col.title}
                  onChange={(e) => updateColumn(col.id, { title: e.target.value })}
                  disabled={readOnly}
                  placeholder="Plan name"
                  className="chrome-input flex-1 text-xs"
                />
                <button onClick={() => moveColumn(col.id, -1)} disabled={i === 0 || readOnly} className="px-1 text-xs disabled:opacity-30">
                  ↑
                </button>
                <button
                  onClick={() => moveColumn(col.id, 1)}
                  disabled={i === columns.length - 1 || readOnly}
                  className="px-1 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button onClick={() => removeColumn(col.id)} disabled={readOnly} className="px-1 text-xs text-red-600 disabled:opacity-30">
                  ✕
                </button>
              </div>
              <label className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  checked={col.highlighted}
                  onChange={(e) => updateColumn(col.id, { highlighted: e.target.checked })}
                  disabled={readOnly}
                />
                Highlighted
              </label>
            </div>
          ))}
          {columns.length === 0 && <p className="text-xs text-[var(--text-faint)]">No columns yet.</p>}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="chrome-label !mb-0">Rows (features)</label>
          <button
            onClick={addRow}
            disabled={readOnly || columns.length === 0}
            className="chrome-btn chrome-btn-secondary !py-1 text-xs"
          >
            + Add row
          </button>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={row.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] p-2">
              <div className="flex items-center gap-2">
                <input
                  value={row.label}
                  onChange={(e) => updateRow(row.id, { label: e.target.value })}
                  disabled={readOnly}
                  placeholder="Feature name"
                  className="chrome-input flex-1 text-xs"
                />
                <button onClick={() => moveRow(row.id, -1)} disabled={i === 0 || readOnly} className="px-1 text-xs disabled:opacity-30">
                  ↑
                </button>
                <button
                  onClick={() => moveRow(row.id, 1)}
                  disabled={i === rows.length - 1 || readOnly}
                  className="px-1 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button onClick={() => removeRow(row.id)} disabled={readOnly} className="px-1 text-xs text-red-600 disabled:opacity-30">
                  ✕
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {columns.map((col, ci) => (
                  <div key={col.id}>
                    <label className="block text-[10px] text-[var(--text-faint)]">{col.title || `Col ${ci + 1}`}</label>
                    <input
                      value={row.cells[ci] ?? ""}
                      onChange={(e) => updateCell(row.id, ci, e.target.value)}
                      disabled={readOnly}
                      placeholder="yes / no / text"
                      className="chrome-input w-full text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-xs text-[var(--text-faint)]">No rows yet.</p>}
        </div>
      </div>
    </div>
  );
}
