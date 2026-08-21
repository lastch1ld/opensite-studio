"use client";

import { useState } from "react";
import Link from "next/link";
import type { Block } from "@/components/blocks/types";
import { blockRegistry } from "@/components/blocks/registry";

type ToolbarProps = {
  siteId: string;
  pageTitle: string;
  onAdd: (type: Block["type"]) => void;
  onDelete: () => void;
  canDelete: boolean;
  onPublish: () => void;
  publishing: boolean;
  saveStatus: "idle" | "saving" | "saved";
};

export function Toolbar({ siteId, pageTitle, onAdd, onDelete, canDelete, onPublish, publishing, saveStatus }: ToolbarProps) {
  const [type, setType] = useState<Block["type"]>("text");

  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-2">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/sites/${siteId}`} className="text-sm text-gray-500 underline">
          &larr; {pageTitle}
        </Link>
        <span className="text-xs text-gray-400">
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as Block["type"])}
          className="rounded border px-2 py-1 text-sm"
        >
          {(Object.keys(blockRegistry) as Block["type"][]).map((t) => (
            <option key={t} value={t}>
              {blockRegistry[t].label}
            </option>
          ))}
        </select>
        <button onClick={() => onAdd(type)} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">
          Add block
        </button>
        <button
          onClick={onDelete}
          disabled={!canDelete}
          className="rounded border px-3 py-1 text-sm text-red-600 hover:bg-gray-50 disabled:opacity-40"
        >
          Delete selected
        </button>
        <button
          onClick={onPublish}
          disabled={publishing}
          className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}
