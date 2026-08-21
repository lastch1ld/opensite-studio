"use client";

import Link from "next/link";
import type { Block, Breakpoint } from "@/components/blocks/types";
import { blockRegistry } from "@/components/blocks/registry";
import { BREAKPOINTS } from "@/lib/responsiveStyle";
import { PaletteItem } from "./dnd/PaletteItem";

type ToolbarProps = {
  siteId: string;
  pageTitle: string;
  onAdd: (type: Block["type"]) => void;
  onDelete: () => void;
  canDelete: boolean;
  onPublish: () => void;
  publishing: boolean;
  saveStatus: "idle" | "saving" | "saved";
  activeBreakpoint: Breakpoint;
  onBreakpointChange: (bp: Breakpoint) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export function Toolbar({
  siteId,
  pageTitle,
  onAdd,
  onDelete,
  canDelete,
  onPublish,
  publishing,
  saveStatus,
  activeBreakpoint,
  onBreakpointChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-2 border-b bg-white px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/sites/${siteId}`} className="text-sm text-gray-500 underline">
            &larr; {pageTitle}
          </Link>
          <span className="text-xs text-gray-400">
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded border">
            {BREAKPOINTS.map((bp) => (
              <button
                key={bp.id}
                onClick={() => onBreakpointChange(bp.id)}
                className={`px-2 py-1 text-xs ${
                  activeBreakpoint === bp.id ? "bg-black text-white" : "hover:bg-gray-50"
                }`}
              >
                {bp.label}
              </button>
            ))}
          </div>
          <button onClick={onUndo} disabled={!canUndo} className="rounded border px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-40">
            Undo
          </button>
          <button onClick={onRedo} disabled={!canRedo} className="rounded border px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-40">
            Redo
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Add block:</span>
        {(Object.keys(blockRegistry) as Block["type"][]).map((t) => (
          <PaletteItem key={t} type={t} label={blockRegistry[t].label} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}
