"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import type { Block, Breakpoint, PageContent } from "@/components/blocks/types";
import { getAllBlockDefinitions } from "@/components/blocks/registry";
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
    <div className="flex flex-col gap-2.5 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={backHref ?? `/dashboard/sites/${siteId}`} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
            &larr; {pageTitle}
          </Link>
          <span className="text-xs text-[var(--text-faint)]">
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup.Root
            type="single"
            value={activeBreakpoint}
            onValueChange={(v) => v && onBreakpointChange(v as Breakpoint)}
            className="chrome-toggle-group"
          >
            {BREAKPOINTS.map((bp) => (
              <ToggleGroup.Item key={bp.id} value={bp.id} className="chrome-toggle-item">
                {bp.label}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
          {locales.length > 0 && (
            <select
              value={activeLocaleId ?? locales.find((l) => l.isDefault)?.id ?? ""}
              onChange={(e) => onLocaleChange(e.target.value || null)}
              title="Locale being previewed/edited — switching doesn't change structure, only which Translation values the Inspector reads/writes"
              className="chrome-input !py-1 text-xs"
            >
              {locales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label} ({l.code}){l.isDefault ? " — default" : ""}
                </option>
              ))}
            </select>
          )}
          <button onClick={onUndo} disabled={!canUndo} className="chrome-btn chrome-btn-secondary !px-2 !py-1">
            Undo
          </button>
          <button onClick={onRedo} disabled={!canRedo} className="chrome-btn chrome-btn-secondary !px-2 !py-1">
            Redo
          </button>
          <button onClick={onDelete} disabled={!canDelete} className="chrome-btn chrome-btn-danger !py-1">
            Delete selected
          </button>
          <button onClick={onSaveAsBlock} disabled={!canSaveAsBlock} className="chrome-btn chrome-btn-secondary !py-1">
            Save as reusable block
          </button>
          {mode === "page" && (
            <>
              <VersionHistoryPanel siteId={siteId} pageId={pageId} canRestore={!readOnly} onRestore={onRestore} />
              <button
                onClick={onPublish}
                disabled={publishing || !canPublish}
                title={canPublish ? undefined : "Only the site owner can publish"}
                className="chrome-btn chrome-btn-primary !py-1"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </>
          )}
        </div>
      </div>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">Add block:</span>
          {getAllBlockDefinitions().map((def) => (
            <PaletteItem key={def.type} type={def.type} label={def.label} onAdd={onAdd} />
          ))}
        </div>
      )}
      {!readOnly && savedBlocks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">Insert saved block:</span>
          {savedBlocks.map((saved) => (
            <button key={saved.id} onClick={() => onInsertSavedBlock(saved)} className="chrome-btn chrome-btn-secondary !py-1 text-xs" title="Insert a copy">
              {saved.name}
            </button>
          ))}
        </div>
      )}
      {extraToolbar}
    </div>
  );
}
