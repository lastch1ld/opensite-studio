"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Block, PageContent } from "@/components/blocks/types";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { createBlock } from "@/components/blocks/registry";
import { addBlock, deleteBlock, findBlock, updateBlock } from "@/lib/blockTree";
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
  const [content, setContent] = useState(initialContent);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [publishing, setPublishing] = useState(false);
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

  const handleAdd = useCallback(
    (type: Block["type"]) => {
      const parentId =
        selectedId && findBlock(content.root, selectedId)?.type === "section" ? selectedId : content.root.id;
      const newBlock = createBlock(type);
      setContent((prev) => ({ ...prev, root: addBlock(prev.root, parentId, newBlock) }));
      setSelectedId(newBlock.id);
    },
    [content.root, selectedId],
  );

  const handleDelete = useCallback(() => {
    if (!selectedId || selectedId === content.root.id) return;
    setContent((prev) => ({ ...prev, root: deleteBlock(prev.root, selectedId) }));
    setSelectedId(null);
  }, [selectedId, content.root]);

  const handleChange = useCallback(
    (group: "props" | "style", key: string, value: string) => {
      if (!selectedId) return;
      setContent((prev) => ({
        ...prev,
        root: updateBlock(prev.root, selectedId, (block) => ({
          ...block,
          [group === "props" ? "props" : "style"]: {
            ...(group === "props" ? block.props : block.style ?? {}),
            [key]: value,
          },
        })),
      }));
    },
    [selectedId],
  );

  async function handlePublish() {
    setPublishing(true);
    await fetch(`/api/sites/${siteId}/pages/${pageId}/publish`, { method: "POST" });
    setPublishing(false);
  }

  const selectedBlock = selectedId ? findBlock(content.root, selectedId) : null;

  return (
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
      />
      <div className="grid flex-1 grid-cols-[220px_1fr_280px] overflow-hidden">
        <LayersPanel root={content.root} selectedId={selectedId} onSelect={setSelectedId} />
        <div className="overflow-y-auto bg-gray-50 p-6" onClick={() => setSelectedId(null)}>
          <div className="mx-auto max-w-3xl bg-white shadow-sm">
            <BlockRenderer block={content.root} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        </div>
        <Inspector block={selectedBlock} onChange={handleChange} />
      </div>
    </div>
  );
}
