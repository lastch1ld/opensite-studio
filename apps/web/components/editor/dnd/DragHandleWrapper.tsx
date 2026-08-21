"use client";

import type { ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Block } from "@/components/blocks/types";

export function DragHandleWrapper({ block, isRoot, children }: { block: Block; isRoot: boolean; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: block.id,
    data: { blockId: block.id },
    disabled: isRoot,
  });

  return (
    <div ref={setNodeRef} style={{ position: "relative", opacity: isDragging ? 0.4 : 1 }}>
      {!isRoot && (
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          title="Drag to move"
          className="absolute -left-5 top-1 z-10 cursor-grab select-none rounded border bg-white px-1 text-xs leading-4 text-gray-500 shadow-sm"
        >
          ⠿
        </button>
      )}
      {children}
    </div>
  );
}
