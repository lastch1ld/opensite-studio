"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Block, Breakpoint, PageContent } from "@/components/blocks/types";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { createBlock } from "@/components/blocks/registry";
import { addBlock, addBlockAt, deleteBlock, findBlock, moveBlock, updateBlock } from "@/lib/blockTree";
import { useHistory } from "@/lib/useHistory";
import { BREAKPOINTS } from "@/lib/responsiveStyle";
import { DragHandleWrapper } from "./dnd/DragHandleWrapper";
import { DropSlotList } from "./dnd/DropSlotList";
import { LayersPanel } from "./LayersPanel";
import { Inspector } from "./Inspector";
import { Toolbar } from "./Toolbar";

const AUTOSAVE_DELAY_MS = 1000;

export function EditorClient({
  siteId,
  pageId,
  pageTitle,
  initialContent,
}: {
  siteId: string;
  pageId: string;
  pageTitle: string;
  initialContent: PageContent;
}) {
  const { present: content, update: updateContent, undo, redo, canUndo, canRedo } = useHistory(initialContent);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [publishing, setPublishing] = useState(false);
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>("base");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftContent: content }),
      });
      setSaveStatus("saved");
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);
      if (isEditable) return;
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const handleAdd = useCallback(
    (type: Block["type"]) => {
      const parentId =
        selectedId && findBlock(content.root, selectedId)?.children !== undefined ? selectedId : content.root.id;
      const newBlock = createBlock(type);
      updateContent((prev) => ({ ...prev, root: addBlock(prev.root, parentId, newBlock) }));
      setSelectedId(newBlock.id);
    },
    [content.root, selectedId, updateContent],
  );

  const handleDelete = useCallback(() => {
    if (!selectedId || selectedId === content.root.id) return;
    updateContent((prev) => ({ ...prev, root: deleteBlock(prev.root, selectedId) }));
    setSelectedId(null);
  }, [selectedId, content.root, updateContent]);

  const handleChange = useCallback(
    (group: "props" | "style", key: string, value: string) => {
      if (!selectedId) return;
      updateContent((prev) => ({
        ...prev,
        root: updateBlock(prev.root, selectedId, (block) => {
          if (group === "props") {
            return { ...block, props: { ...block.props, [key]: value } };
          }
          const style = block.style ?? {};
          return {
            ...block,
            style: { ...style, [activeBreakpoint]: { ...(style[activeBreakpoint] ?? {}), [key]: value } },
          };
        }),
      }));
    },
    [selectedId, activeBreakpoint, updateContent],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
      const overData = over.data.current as { containerId: string; index: number } | undefined;
      if (!overData) return;
      const activeId = String(active.id);

      updateContent((prev) => {
        if (activeId.startsWith("palette:")) {
          const type = activeId.slice("palette:".length) as Block["type"];
          const newBlock = createBlock(type);
          return { ...prev, root: addBlockAt(prev.root, overData.containerId, newBlock, overData.index) };
        }
        return { ...prev, root: moveBlock(prev.root, activeId, overData.containerId, overData.index) };
      });
    },
    [updateContent],
  );

  async function handlePublish() {
    setPublishing(true);
    await fetch(`/api/sites/${siteId}/pages/${pageId}/publish`, { method: "POST" });
    setPublishing(false);
  }

  const selectedBlock = selectedId ? findBlock(content.root, selectedId) : null;
  const canvasWidth = BREAKPOINTS.find((bp) => bp.id === activeBreakpoint)?.previewWidth ?? 1200;

  const renderNodeWrapper = useCallback(
    (block: Block, node: ReactNode, isRoot: boolean) => (
      <DragHandleWrapper block={block} isRoot={isRoot}>
        {node}
      </DragHandleWrapper>
    ),
    [],
  );

  const renderChildrenWrapper = useCallback(
    (container: Block, childNodes: ReactNode[], childBlocks: Block[]) => (
      <DropSlotList containerId={container.id} childNodes={childNodes} childBlocks={childBlocks} />
    ),
    [],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col">
        <Toolbar
          siteId={siteId}
          pageTitle={pageTitle}
          onAdd={handleAdd}
          onDelete={handleDelete}
          canDelete={Boolean(selectedId && selectedId !== content.root.id)}
          onPublish={handlePublish}
          publishing={publishing}
          saveStatus={saveStatus}
          activeBreakpoint={activeBreakpoint}
          onBreakpointChange={setActiveBreakpoint}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <div className="grid flex-1 grid-cols-[220px_1fr_280px] overflow-hidden">
          <LayersPanel root={content.root} selectedId={selectedId} onSelect={setSelectedId} />
          <div className="overflow-y-auto bg-gray-50 p-6" onClick={() => setSelectedId(null)}>
            <div className="mx-auto bg-white shadow-sm" style={{ maxWidth: `${canvasWidth}px` }}>
              <BlockRenderer
                block={content.root}
                selectedId={selectedId}
                onSelect={setSelectedId}
                activeBreakpoint={activeBreakpoint}
                renderNodeWrapper={renderNodeWrapper}
                renderChildrenWrapper={renderChildrenWrapper}
                isRoot
              />
            </div>
          </div>
          <Inspector block={selectedBlock} siteId={siteId} activeBreakpoint={activeBreakpoint} onChange={handleChange} />
        </div>
      </div>
    </DndContext>
  );
}
