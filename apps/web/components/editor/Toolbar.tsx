"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Eye, Layers, Redo2, SlidersHorizontal, Sparkles, Trash2, Undo2 } from "lucide-react";
import type { Breakpoint, PageContent } from "@/components/blocks/types";
import { BREAKPOINTS } from "@/lib/responsiveStyle";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import type { LocaleSummary } from "./EditorClient";

type ToolbarProps = {
  siteId: string;
  pageId: string;
  pageTitle: string;
  mode?: "page" | "template";
  backHref?: string;
  extraToolbar?: ReactNode;
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
  canSaveAsBlock: boolean;
  onSaveAsBlock: () => void;
  readOnly: boolean;
  onRestore: (content: PageContent) => void;
  // docs/ui-ux-roadmap.md: the old permanent Layers/Inspector rails are now
  // contextual floating panels — these two toggle their visibility. Grouped
  // together with the breakpoint switcher below (one "view controls" pill)
  // since all three change what's visible, not what's edited.
  layersOpen: boolean;
  onToggleLayers: () => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
  // "Not technical mode": swaps field labels for plain-language ones
  // (components/blocks/registry.tsx's `friendlyLabel`) across the
  // floating properties panel.
  simpleMode: boolean;
  onToggleSimpleMode: () => void;
};

export function Toolbar({
  siteId,
  pageId,
  pageTitle,
  mode = "page",
  backHref,
  extraToolbar,
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
  canSaveAsBlock,
  onSaveAsBlock,
  readOnly,
  onRestore,
  layersOpen,
  onToggleLayers,
  panelOpen,
  onTogglePanel,
  simpleMode,
  onToggleSimpleMode,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={backHref ?? `/dashboard/sites/${siteId}`} className="shrink-0 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
            &larr; {pageTitle}
          </Link>
          <span className="shrink-0 text-xs text-[var(--text-faint)]">
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
        {/* View controls: what's shown on screen — Layers, Properties, breakpoint preview. */}
        <div className="chrome-toolbar-group">
          <button
            onClick={onToggleLayers}
            aria-pressed={layersOpen}
            title="Layers"
            className="chrome-toggle-item"
            data-state={layersOpen ? "on" : "off"}
          >
            <Layers size={14} />
          </button>
          {!readOnly && (
            <button
              onClick={onTogglePanel}
              aria-pressed={panelOpen}
              title="Properties"
              className="chrome-toggle-item"
              data-state={panelOpen ? "on" : "off"}
            >
              <SlidersHorizontal size={14} />
            </button>
          )}
          <div className="chrome-divider" />
          <ToggleGroup.Root
            type="single"
            value={activeBreakpoint}
            onValueChange={(v) => v && onBreakpointChange(v as Breakpoint)}
            className="inline-flex items-center gap-1"
          >
            {BREAKPOINTS.map((bp) => (
              <ToggleGroup.Item key={bp.id} value={bp.id} className="chrome-toggle-item">
                {bp.label}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </div>

        <button
          onClick={onToggleSimpleMode}
          aria-pressed={simpleMode}
          title={simpleMode ? "Simple mode is on — plain-language field names" : "Turn on simple mode for plain-language field names"}
          className={`chrome-btn !px-2 !py-1 ${simpleMode ? "chrome-btn-primary" : "chrome-btn-secondary"}`}
        >
          <Sparkles size={14} />
          <span className="hidden lg:inline">Simple mode</span>
        </button>

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

        <div className="chrome-divider" />

        {/* Edit actions: what's being changed. */}
        <div className="chrome-toolbar-group">
          <button onClick={onUndo} disabled={!canUndo} title="Undo" className="chrome-toggle-item disabled:opacity-40">
            <Undo2 size={14} />
          </button>
          <button onClick={onRedo} disabled={!canRedo} title="Redo" className="chrome-toggle-item disabled:opacity-40">
            <Redo2 size={14} />
          </button>
          <button onClick={onDelete} disabled={!canDelete} title="Delete selected block" className="chrome-toggle-item text-[var(--danger)] disabled:opacity-40">
            <Trash2 size={14} />
          </button>
        </div>

        <button onClick={onSaveAsBlock} disabled={!canSaveAsBlock} className="chrome-btn chrome-btn-secondary !py-1">
          Save as reusable block
        </button>

        {mode === "page" && (
          <>
            <div className="chrome-divider" />
            <a
              href={`/preview/${siteId}/${pageId}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open a real preview of the current draft in a new tab"
              className="chrome-btn chrome-btn-secondary !py-1"
            >
              <Eye size={14} />
              Preview
            </a>
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

      {extraToolbar}
    </div>
  );
}
