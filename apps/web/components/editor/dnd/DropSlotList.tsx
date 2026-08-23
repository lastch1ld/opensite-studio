"use client";

import type { ReactNode } from "react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import type { Block } from "@/components/blocks/types";

function DropSlot({ containerId, index }: { containerId: string; index: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${containerId}:${index}`,
    data: { containerId, index },
  });
  // Only takes up real layout space while a drag is in progress
  // (`display: contents` when idle removes it from the render tree
  // entirely, same as not being there at all). A CSS Grid container
  // (the "columns"/"list" blocks) treats every direct child — including
  // an always-present drop-slot div — as its own grid cell, which shoves
  // real content out of the intended N-column pattern; a permanently
  // "invisible" 6px-tall slot is still a real, layout-participating grid
  // item. Idle-hiding it is what makes the editor canvas match the real
  // published grid instead of only resembling it.
  const { active } = useDndContext();
  if (!active) return <div ref={setNodeRef} style={{ display: "contents" }} />;
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
