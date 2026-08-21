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
import { addBlock, addBlockAt, cloneWithNewIds, deleteBlock, findBlock, moveBlock, updateBlock } from "@/lib/blockTree";
import { useHistory } from "@/lib/useHistory";
import { BREAKPOINTS } from "@/lib/responsiveStyle";
import type { ThemeTokens } from "@/lib/theme";
import { DragHandleWrapper } from "./dnd/DragHandleWrapper";
import { DropSlotList } from "./dnd/DropSlotList";
import { LayersPanel } from "./LayersPanel";
import { Inspector } from "./Inspector";
import { Toolbar } from "./Toolbar";

export type SavedBlockSummary = { id: string; name: string; content: Block };

const AUTOSAVE_DELAY_MS = 1000;

export function EditorClient({
  siteId,
  pageId,
  pageTitle,
  initialContent,
  canPublish = true,
  readOnly = false,
}: {
  siteId: string;
  pageId: string;
  pageTitle: string;
  initialContent: PageContent;
  canPublish?: boolean;
  readOnly?: boolean;
}) {
  const { present: content, update: updateContent, undo, redo, canUndo, canRedo } = useHistory(initialContent);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [publishing, setPublishing] = useState(false);
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>("base");
  const [theme, setTheme] = useState<ThemeTokens | null>(null);
  const [savedBlocks, setSavedBlocks] = useState<SavedBlockSummary[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const refreshSavedBlocks = useCallback(() => {
    fetch(`/api/sites/${siteId}/saved-blocks`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SavedBlockSummary[]) => setSavedBlocks(data));
  }, [siteId]);

  useEffect(() => {
    fetch(`/api/sites/${siteId}/theme`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { tokens: ThemeTokens } | null) => setTheme(data?.tokens ?? null));
    refreshSavedBlocks();
  }, [siteId, refreshSavedBlocks]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (readOnly) return;
    queueMicrotask(() => setSaveStatus("saving"));
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
    (group: "props" | "style", key: string, value: string | { $token: string }) => {
      if (!selectedId || readOnly) return;
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
    [selectedId, activeBreakpoint, readOnly, updateContent],
  );

  const handleSaveAsBlock = useCallback(async () => {
    if (!selectedId) return;
    const block = findBlock(content.root, selectedId);
    if (!block) return;
    const name = window.prompt("Name this reusable block:");
    if (!name || !name.trim()) return;
    const res = await fetch(`/api/sites/${siteId}/saved-blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), content: block }),
    });
    if (res.ok) refreshSavedBlocks();
  }, [selectedId, content.root, siteId, refreshSavedBlocks]);

  // Detached copy: inserting re-generates every id in the subtree (see
  // lib/blockTree.ts's cloneWithNewIds), so the copy diverges from the
  // saved original immediately and from any other prior insert. Linked
  // symbols (edit-one-updates-all) would need the block tree to store a
  // reference + resolve it at render time everywhere (editor canvas, public
  // renderer, publish snapshotting) — a bigger change than this first pass
  // warrants, and detached is what data-model.md flags as the open question
  // this project can defer.
  const handleInsertSavedBlock = useCallback(
    (saved: SavedBlockSummary) => {
      const parentId =
        selectedId && findBlock(content.root, selectedId)?.children !== undefined ? selectedId : content.root.id;
      const newBlock = cloneWithNewIds(saved.content);
      updateContent((prev) => ({ ...prev, root: addBlock(prev.root, parentId, newBlock) }));
      setSelectedId(newBlock.id);
    },
    [content.root, selectedId, updateContent],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (readOnly) return;
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
    [readOnly, updateContent],
  );

  async function handlePublish() {
    if (!canPublish) return;
    setPublishing(true);
    await fetch(`/api/sites/${siteId}/pages/${pageId}/publish`, { method: "POST" });
    setPublishing(false);
  }

  const handleRestore = useCallback(
    (restoredContent: PageContent) => {
      updateContent(() => restoredContent);
    },
    [updateContent],
  );

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
          pageId={pageId}
          pageTitle={pageTitle}
          onAdd={handleAdd}
          onDelete={handleDelete}
          canDelete={Boolean(selectedId && selectedId !== content.root.id) && !readOnly}
          onPublish={handlePublish}
          publishing={publishing}
          canPublish={canPublish}
          saveStatus={saveStatus}
          activeBreakpoint={activeBreakpoint}
          onBreakpointChange={setActiveBreakpoint}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo && !readOnly}
          canRedo={canRedo && !readOnly}
          savedBlocks={savedBlocks}
          canSaveAsBlock={Boolean(selectedId) && !readOnly}
          onSaveAsBlock={handleSaveAsBlock}
          onInsertSavedBlock={handleInsertSavedBlock}
          readOnly={readOnly}
          onRestore={handleRestore}
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
                theme={theme}
                renderNodeWrapper={renderNodeWrapper}
                renderChildrenWrapper={renderChildrenWrapper}
                isRoot
              />
            </div>
          </div>
          <Inspector
            block={selectedBlock}
            siteId={siteId}
            activeBreakpoint={activeBreakpoint}
            theme={theme}
            onChange={handleChange}
          />
        </div>
      </div>
    </DndContext>
  );
}
