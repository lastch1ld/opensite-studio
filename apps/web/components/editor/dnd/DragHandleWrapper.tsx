"use client";

import type { ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { Copy, GripVertical, Save, Trash2 } from "lucide-react";
import type { Block } from "@/components/blocks/types";

export function DragHandleWrapper({
  block,
  isRoot,
  readOnly = false,
  onSelect,
  onDelete,
  onDuplicate,
  onSaveAsBlock,
  children,
}: {
  block: Block;
  isRoot: boolean;
  readOnly?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onSaveAsBlock?: (id: string) => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: block.id,
    data: { blockId: block.id },
    disabled: isRoot,
  });

  const node = (
    <div ref={setNodeRef} style={{ position: "relative", opacity: isDragging ? 0.4 : 1 }}>
      {!isRoot && (
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          title="Drag to move"
          className="absolute -left-5 top-1 z-10 cursor-grab select-none rounded border border-[var(--border-strong)] bg-[var(--surface)] px-1 text-xs leading-4 text-[var(--text-muted)] shadow-sm"
        >
          <GripVertical size={12} />
        </button>
      )}
      {children}
    </div>
  );

  // Read-only viewers (VIEWER role) and the page root get no context menu
  // — the root can't be deleted/duplicated (there'd be nothing left to
  // render), and a read-only viewer shouldn't see edit actions at all.
  if (readOnly || isRoot || !onDelete) return node;

  return (
    <ContextMenu.Root
      onOpenChange={(open) => {
        if (open) onSelect?.(block.id);
      }}
    >
      <ContextMenu.Trigger asChild>{node}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="chrome-card z-50 min-w-[180px] overflow-hidden p-1 text-sm">
          <ContextMenu.Item
            onSelect={() => onDuplicate?.(block.id)}
            className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-[var(--text)] outline-none data-[highlighted]:bg-[var(--surface-sunken)]"
          >
            <Copy size={14} /> Duplicate
          </ContextMenu.Item>
          <ContextMenu.Item
            onSelect={() => onSaveAsBlock?.(block.id)}
            className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-[var(--text)] outline-none data-[highlighted]:bg-[var(--surface-sunken)]"
          >
            <Save size={14} /> Save as reusable block
          </ContextMenu.Item>
          <ContextMenu.Separator className="my-1 h-px bg-[var(--border)]" />
          <ContextMenu.Item
            onSelect={() => onDelete?.(block.id)}
            className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-[var(--danger)] outline-none data-[highlighted]:bg-[var(--danger-soft)]"
          >
            <Trash2 size={14} /> Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
