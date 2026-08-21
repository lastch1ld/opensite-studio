"use client";

import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Block } from "@/components/blocks/types";

function DropSlot({ containerId, index }: { containerId: string; index: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${containerId}:${index}`,
    data: { containerId, index },
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        height: isOver ? "10px" : "6px",
        borderRadius: "3px",
        background: isOver ? "#2563eb" : "transparent",
      }}
    />
  );
}

// Renders a container's children interleaved with droppable slots (one
// before the first child, one after each child) so a drag can target any
// position — used only by the editor via BlockRenderer's renderChildrenWrapper.
export function DropSlotList({
  containerId,
  childNodes,
  childBlocks,
}: {
  containerId: string;
  childNodes: ReactNode[];
  childBlocks: Block[];
}) {
  return (
    <>
      <DropSlot containerId={containerId} index={0} />
      {childBlocks.map((child, i) => (
        <div key={child.id} style={{ display: "contents" }}>
          {childNodes[i]}
          <DropSlot containerId={containerId} index={i + 1} />
        </div>
      ))}
    </>
  );
}
