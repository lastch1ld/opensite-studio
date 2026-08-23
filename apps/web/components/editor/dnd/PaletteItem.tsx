"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Block } from "@/components/blocks/types";

export function PaletteItem({ type, label, onAdd }: { type: Block["type"]; label: string; onAdd: (type: Block["type"]) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { paletteType: type },
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onAdd(type)}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="chrome-btn chrome-btn-secondary !py-1 cursor-grab text-xs"
      title="Click to add, or drag onto the canvas"
    >
      {label}
    </button>
  );
}
