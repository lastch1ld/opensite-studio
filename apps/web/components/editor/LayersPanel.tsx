"use client";

import type { Block } from "@/components/blocks/types";
import { getBlockDefinition } from "@/components/blocks/registry";

function LayerNode({
  block,
  depth,
  selectedId,
  onSelect,
}: {
  block: Block;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const isSelected = block.id === selectedId;
  return (
    <div>
      <button
        onClick={() => onSelect(block.id)}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        className={`block w-full truncate py-1.5 pr-3 text-left text-sm transition-colors ${
          isSelected ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--surface-sunken)]"
        }`}
      >
        {getBlockDefinition(block.type)?.label ?? block.type}
      </button>
      {block.children?.map((child) => (
        <LayerNode key={child.id} block={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

// docs/ui-ux-roadmap.md: no longer a permanent left rail — this renders
// just the tree; the floating panel chrome (header, close button) lives in
// whichever container mounts it (EditorClient.tsx).
export function LayersPanel({
  root,
  selectedId,
  onSelect,
}: {
  root: Block;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="py-1.5">
      <LayerNode block={root} depth={0} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
}
