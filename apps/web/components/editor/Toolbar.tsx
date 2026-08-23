"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Block, Breakpoint, PageContent } from "@/components/blocks/types";
import { blockRegistry } from "@/components/blocks/registry";
import { BREAKPOINTS } from "@/lib/responsiveStyle";
import { PaletteItem } from "./dnd/PaletteItem";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import type { SavedBlockSummary, LocaleSummary } from "./EditorClient";

type ToolbarProps = {
  siteId: string;
  pageId: string;
  pageTitle: string;
  mode?: "page" | "template";
  backHref?: string;
  extraToolbar?: ReactNode;
  onAdd: (type: Block["type"]) => void;
  onDelete: () => void;
  canDelete: boolean;
  onPublish: () => void;
  publishing: boolean;
  canPublish: boolean;
  saveStatus: "idle" | "saving" | "saved";
  activeBreakpoint: Breakpoint;
  onBreakpointChange: (bp: Breakpoint) => void;
  // docs/multilingual.md: a sibling of the breakpoint switcher above, same
  // "scoped local state that changes what the canvas/Inspector read/write"
  // shape (docs/editor.md). Empty `locales` (the common case for a site
  // that hasn't set up multilingual) hides the switcher entirely.
  locales: LocaleSummary[];
  activeLocaleId: string | null;
  onLocaleChange: (localeId: string | null) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  savedBlocks: SavedBlockSummary[];
  canSaveAsBlock: boolean;
  onSaveAsBlock: () => void;
  onInsertSavedBlock: (saved: SavedBlockSummary) => void;
  readOnly: boolean;
  onRestore: (content: PageContent) => void;
};

export function Toolbar({
  siteId,
  pageId,
  pageTitle,
  mode = "page",
  backHref,
  extraToolbar,
  onAdd,
  onDelete,
  canDelete,
  onPublish,
  publishing,
  canPublish,
  saveStatus,
  activeBreakpoint,
  onBreakpointChange,
  locales,
  activeLocaleId,
  onLocaleChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  savedBlocks,
  canSaveAsBlock,
  onSaveAsBlock,
  onInsertSavedBlock,
  readOnly,
  onRestore,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-2 border-b bg-white px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={backHref ?? `/dashboard/sites/${siteId}`} className="text-sm text-gray-500 underline">
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
          {locales.length > 0 && (
            <select
              value={activeLocaleId ?? locales.find((l) => l.isDefault)?.id ?? ""}
              onChange={(e) => onLocaleChange(e.target.value || null)}
              title="Locale being previewed/edited — switching doesn't change structure, only which Translation values the Inspector reads/writes"
              className="rounded border px-2 py-1 text-xs"
            >
              {locales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label} ({l.code}){l.isDefault ? " — default" : ""}
                </option>
              ))}
            </select>
          )}
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
            onClick={onSaveAsBlock}
            disabled={!canSaveAsBlock}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Save as reusable block
          </button>
          {mode === "page" && (
            <>
              <VersionHistoryPanel siteId={siteId} pageId={pageId} canRestore={!readOnly} onRestore={onRestore} />
              <button
                onClick={onPublish}
                disabled={publishing || !canPublish}
                title={canPublish ? undefined : "Only the site owner can publish"}
                className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                {publishing ? "Publishing..." : "Publish"}
              </button>
            </>
          )}
        </div>
      </div>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Add block:</span>
          {(Object.keys(blockRegistry) as Block["type"][]).map((t) => (
            <PaletteItem key={t} type={t} label={blockRegistry[t].label} onAdd={onAdd} />
          ))}
        </div>
      )}
      {!readOnly && savedBlocks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Insert saved block:</span>
          {savedBlocks.map((saved) => (
            <button
              key={saved.id}
              onClick={() => onInsertSavedBlock(saved)}
              className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
              title="Insert a copy"
            >
              {saved.name}
            </button>
          ))}
        </div>
      )}
      {extraToolbar}
    </div>
  );
}
