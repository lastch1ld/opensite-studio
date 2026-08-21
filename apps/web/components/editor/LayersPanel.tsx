"use client";

import type { Block } from "@/components/blocks/types";
import { blockRegistry } from "@/components/blocks/registry";

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
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        className={`block w-full truncate py-1 text-left text-sm ${
          isSelected ? "bg-blue-100 font-medium text-blue-900" : "hover:bg-gray-100"
        }`}
      >
        {blockRegistry[block.type]?.label ?? block.type}
      </button>
      {block.children?.map((child) => (
        <LayerNode key={child.id} block={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

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
    <div className="h-full overflow-y-auto border-r bg-white">
      <h2 className="border-b px-3 py-2 text-xs font-semibold uppercase text-gray-500">Layers</h2>
      <LayerNode block={root} depth={0} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
}
