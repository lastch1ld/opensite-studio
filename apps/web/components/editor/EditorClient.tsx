"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Block, Breakpoint, PageContent } from "@/components/blocks/types";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { createBlock, getAllBlockDefinitions } from "@/components/blocks/registry";
import { addBlock, addBlockAt, cloneWithNewIds, deleteBlock, findBlock, findParent, moveBlock, updateBlock } from "@/lib/blockTree";
import { useHistory } from "@/lib/useHistory";
import { BREAKPOINTS } from "@/lib/responsiveStyle";
import type { ThemeTokens } from "@/lib/theme";
import type { CollectionField } from "@/lib/collectionSchema";
import type { CollectionItemLite, RenderContext } from "@/lib/bind";
import { resolveTemplate, type TemplateLite } from "@/lib/templates";
import { translationKey } from "@/lib/translations";
import { DragHandleWrapper } from "./dnd/DragHandleWrapper";
import { DropSlotList } from "./dnd/DropSlotList";
import { PaletteItem } from "./dnd/PaletteItem";
import { LayersPanel } from "./LayersPanel";
import { Inspector } from "./Inspector";
import { Toolbar } from "./Toolbar";
import { ClipboardPanel } from "./ClipboardPanel";
import { SeoPanel } from "./SeoPanel";
import { FloatingPanel } from "./FloatingPanel";
import { SectionPicker } from "./SectionPicker";
import { defaultPageSeo, type PageSeo } from "@/lib/seo";
import { CustomFontStyles } from "@/components/CustomFontStyles";
import type { CustomFont } from "@/lib/siteSettings";

const SIMPLE_MODE_STORAGE_KEY = "opensite:editor:simpleMode";

export type SavedBlockSummary = { id: string; name: string; content: Block };
export type CollectionSummary = {
  id: string;
  name: string;
  fieldSchema: CollectionField[];
  items: { id: string; data: Record<string, unknown> }[];
};
export type LocaleSummary = { id: string; code: string; label: string; isDefault: boolean };

const AUTOSAVE_DELAY_MS = 1000;

// Theme Builder reuses this same editor for Templates (docs/theme-builder.md
// "no second editor implementation, just a different content source") —
// `mode: "template"` swaps the save/publish endpoints and hides the
// page-only affordances (publish, version history) that don't apply to a
// Template (single `content` field, no draft/published split).
export function EditorClient({
  siteId,
  pageId,
  pageTitle,
  initialContent,
  canPublish = true,
  readOnly = false,
  mode = "page",
  backHref,
  extraToolbar,
  pageCollectionId = null,
  initialSeo = null,
  templateType = null,
  compositionPage = null,
  siteTemplates = [],
}: {
  siteId: string;
  pageId: string;
  pageTitle: string;
  initialContent: PageContent;
  canPublish?: boolean;
  readOnly?: boolean;
  mode?: "page" | "template";
  backHref?: string;
  extraToolbar?: ReactNode;
  // The Page's own collectionId (see docs/collections.md's dynamic/repeater
  // pages) — when set, the Inspector's bind toggle offers `currentItem`
  // bindings ("whichever CollectionItem this render is for") instead of a
  // fixed-collection binding, since this page's content tree is the
  // per-item template. Irrelevant/omitted in template mode.
  pageCollectionId?: string | null;
  // Page-only (see docs/integrations.md "SEO") — omitted/ignored in template
  // mode, which has no SEO fields.
  initialSeo?: PageSeo | null;
  // Template mode only — the Template's own `type` (docs/theme-builder.md).
  // Drives the composed header/footer preview below.
  templateType?: "header" | "footer" | "pageTemplate" | "collectionItemTemplate" | "popup" | null;
  // A representative Page's published (or draft) content, used to compose
  // a live header/footer preview across a real page instead of showing the
  // template in isolation (docs/theme-builder.md "previews live across
  // representative pages"). Null if the site has no pages yet.
  compositionPage?: PageContent | null;
  // Every other Template on this site, so the composed preview can resolve
  // the matching pageTemplate/opposite header-or-footer slot the same way
  // PublishedPage does. Irrelevant outside header/footer template editing.
  siteTemplates?: TemplateLite[];
}) {
  const { present: content, update: updateContent, undo, redo, canUndo, canRedo } = useHistory(initialContent);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"inspector" | "clipboard" | "seo">("inspector");
  // docs/ui-ux-roadmap.md: the Layers/Inspector rails are now floating
  // panels a user opens/closes, not permanently-reserved grid columns.
  const [layersOpen, setLayersOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  // "Not technical mode" — persisted across sessions since it's a durable
  // user preference, not per-page state. Starts `false` (matching SSR,
  // which has no `window`) and is corrected from localStorage right after
  // mount — a lazy useState initializer would read localStorage during
  // the client's first render too, diverging from the server-rendered
  // markup and triggering a hydration mismatch on the Toolbar's Simple
  // mode button. This is exactly the "subscribe to external state on
  // mount" case React's effect docs describe, not the cascading-render
  // footgun the lint rule below is guarding against.
  const [simpleMode, setSimpleMode] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.localStorage.getItem(SIMPLE_MODE_STORAGE_KEY) === "1") setSimpleMode(true);
  }, []);
  const toggleSimpleMode = useCallback(() => {
    setSimpleMode((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIMPLE_MODE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);
  // Selecting a block (canvas click or Layers tree click) surfaces its
  // properties automatically; deselecting closes the panel again — this is
  // the "context menu switching per current work" behavior, replacing the
  // old always-visible Inspector rail.
  const selectBlock = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
      setRightTab("inspector");
      setPanelOpen(true);
    } else {
      setPanelOpen(false);
    }
  }, []);
  const [seo, setSeo] = useState<PageSeo>(initialSeo ?? defaultPageSeo());
  const seoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [publishing, setPublishing] = useState(false);
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>("base");
  const [theme, setTheme] = useState<ThemeTokens | null>(null);
  const [savedBlocks, setSavedBlocks] = useState<SavedBlockSummary[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [locales, setLocales] = useState<LocaleSummary[]>([]);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [activeLocaleId, setActiveLocaleId] = useState<string | null>(null);
  // Raw fetched map for whichever non-default locale was last active;
  // `translations` below derives the value actually used for rendering
  // (empty for the default locale) rather than resetting this via a
  // synchronous setState in the fetch effect.
  const [fetchedTranslations, setFetchedTranslations] = useState<Record<string, string>>({});
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
    fetch(`/api/sites/${siteId}/collections`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CollectionSummary[]) => setCollections(data));
    fetch(`/api/sites/${siteId}/locales`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: LocaleSummary[]) => setLocales(data));
    fetch(`/api/sites/${siteId}/fonts`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CustomFont[]) => setCustomFonts(data));
    refreshSavedBlocks();
  }, [siteId, refreshSavedBlocks]);

  // docs/multilingual.md's editor locale switcher (a sibling of the
  // responsive-breakpoint switcher above, same "scoped state, not a new
  // paradigm" shape): fetches this entity's Translation overrides for the
  // selected non-default Locale, so both the canvas preview and the
  // Inspector resolve through the same map BlockRenderer reads.
  const translationEntityType = mode === "template" ? "template" : "page";
  const activeLocale = useMemo<LocaleSummary | null>(
    () => locales.find((l) => l.id === activeLocaleId) ?? null,
    [locales, activeLocaleId],
  );

  useEffect(() => {
    if (!activeLocale || activeLocale.isDefault) return;
    let cancelled = false;
    fetch(
      `/api/sites/${siteId}/translations?entityType=${translationEntityType}&entityId=${pageId}&localeId=${activeLocale.id}`,
    )
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, string>) => {
        if (!cancelled) setFetchedTranslations(data);
      });
    return () => {
      cancelled = true;
    };
  }, [siteId, pageId, translationEntityType, activeLocale]);

  // Empty for the default locale (or no locale selected) without needing a
  // separate reset effect — the default locale's content always lives on
  // the base Block/entity, never in a Translation row.
  const translations = useMemo<Record<string, string>>(
    () => (activeLocale && !activeLocale.isDefault ? fetchedTranslations : {}),
    [activeLocale, fetchedTranslations],
  );

  const handleTranslationChange = useCallback(
    (blockId: string, field: string, value: string) => {
      if (!activeLocale || activeLocale.isDefault || readOnly) return;
      const key = translationKey({ entityType: translationEntityType, entityId: pageId, blockId, field });
      setFetchedTranslations((prev) => ({ ...prev, [key]: value }));
      fetch(`/api/sites/${siteId}/translations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localeId: activeLocale.id,
          entityType: translationEntityType,
          entityId: pageId,
          blockId,
          field,
          value,
        }),
      });
    },
    [activeLocale, readOnly, translationEntityType, pageId, siteId],
  );

  const handleTranslationClear = useCallback(
    (blockId: string, field: string) => {
      if (!activeLocale || activeLocale.isDefault || readOnly) return;
      const key = translationKey({ entityType: translationEntityType, entityId: pageId, blockId, field });
      setFetchedTranslations((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      fetch(`/api/sites/${siteId}/translations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localeId: activeLocale.id, entityType: translationEntityType, entityId: pageId, blockId, field }),
      });
    },
    [activeLocale, readOnly, translationEntityType, pageId, siteId],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (readOnly) return;
    queueMicrotask(() => setSaveStatus("saving"));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const url = mode === "template" ? `/api/sites/${siteId}/templates/${pageId}` : `/api/sites/${siteId}/pages/${pageId}`;
      const body = mode === "template" ? { content } : { draftContent: content };
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      selectBlock(newBlock.id);
    },
    [content.root, selectedId, updateContent, selectBlock],
  );

  // Accepts an explicit `id` (context menu) or falls back to the current
  // selection (toolbar button) — a context-menu action selects and acts
  // in one handler, and `selectedId` wouldn't reflect that yet within the
  // same synchronous call (React state updates aren't visible until the
  // next render), so this can't just close over `selectedId` alone.
  const handleDelete = useCallback(
    (id?: string) => {
      const targetId = id ?? selectedId;
      if (!targetId || targetId === content.root.id) return;
      updateContent((prev) => ({ ...prev, root: deleteBlock(prev.root, targetId) }));
      selectBlock(null);
    },
    [selectedId, content.root, updateContent, selectBlock],
  );

  // Inserted as the next sibling of the original (docs/ui-ux-roadmap.md's
  // right-click menu) — a fresh id per node via cloneWithNewIds, same
  // "detached copy" semantics as inserting a saved block.
  const handleDuplicate = useCallback(
    (id: string) => {
      if (readOnly || id === content.root.id) return;
      const parent = findParent(content.root, id);
      if (!parent) return;
      const index = (parent.children ?? []).findIndex((c) => c.id === id);
      const original = findBlock(content.root, id);
      if (!original || index === -1) return;
      const clone = cloneWithNewIds(original);
      updateContent((prev) => ({ ...prev, root: addBlockAt(prev.root, parent.id, clone, index + 1) }));
      selectBlock(clone.id);
    },
    [content.root, readOnly, updateContent, selectBlock],
  );

  const handleChange = useCallback(
    (group: "props" | "style", key: string, value: unknown) => {
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

  const handleSaveAsBlock = useCallback(async (id?: string) => {
    const targetId = id ?? selectedId;
    if (!targetId) return;
    const block = findBlock(content.root, targetId);
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
      selectBlock(newBlock.id);
    },
    [content.root, selectedId, updateContent, selectBlock],
  );

  // lib/sectionPresets.ts's ready-made section catalog — the preset's own
  // `build()` already mints fresh ids (unlike a saved block, which needs
  // cloneWithNewIds since the same stored subtree gets inserted repeatedly).
  // Always inserts at the page root, never into whatever's currently
  // selected — unlike handleAdd/handleInsertSavedBlock (fine-grained
  // block-level composition), "sections" are page-level building blocks
  // (matches how Wix/Squarespace's own "Add Section" behaves). This also
  // sidesteps a real bug the naive selected-container targeting had: each
  // inserted preset auto-selects itself, so a second preset insert would
  // land *inside* the first one instead of beside it — compounding
  // full-bleed blocks' `left: 50%` breakout math with every nesting level.
  const handleInsertSectionPreset = useCallback(
    (newBlock: Block) => {
      updateContent((prev) => ({ ...prev, root: addBlock(prev.root, prev.root.id, newBlock) }));
      selectBlock(newBlock.id);
    },
    [updateContent, selectBlock],
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

  // Content clipboard insertion (docs/content-import.md "Formatting:
  // target block wins"): writes the fragment's plain text into the
  // selected block's own text prop only, never touching its `style` — the
  // target block's existing style/theme keeps governing how it renders.
  const handleInsertFragment = useCallback(
    (propKey: string, text: string) => {
      if (!selectedId || readOnly) return;
      updateContent((prev) => ({
        ...prev,
        root: updateBlock(prev.root, selectedId, (block) => ({ ...block, props: { ...block.props, [propKey]: text } })),
      }));
    },
    [selectedId, readOnly, updateContent],
  );

  const handleSeoChange = useCallback(
    (next: PageSeo) => {
      if (readOnly || mode !== "page") return;
      setSeo(next);
      if (seoSaveTimer.current) clearTimeout(seoSaveTimer.current);
      seoSaveTimer.current = setTimeout(() => {
        fetch(`/api/sites/${siteId}/pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seo: next }),
        });
      }, AUTOSAVE_DELAY_MS);
    },
    [siteId, pageId, mode, readOnly],
  );

  const handleRestore = useCallback(
    (restoredContent: PageContent) => {
      updateContent(() => restoredContent);
    },
    [updateContent],
  );

  const selectedBlock = selectedId ? findBlock(content.root, selectedId) : null;
  const canvasWidth = BREAKPOINTS.find((bp) => bp.id === activeBreakpoint)?.previewWidth ?? 1200;

  // Mirrors renderContextFor in lib/resolveSite.ts so BlockRenderer resolves
  // $bind/collectionFieldEquals identically in the editor canvas and the
  // public renderer — see AGENTS.md "One shared render codepath".
  const collectionItems = useMemo<Record<string, CollectionItemLite[]>>(() => {
    const out: Record<string, CollectionItemLite[]> = {};
    for (const c of collections) out[c.id] = c.items;
    return out;
  }, [collections]);

  const currentItem = useMemo(() => {
    if (mode !== "page" || !pageCollectionId) return null;
    const collection = collections.find((c) => c.id === pageCollectionId);
    const item = collection?.items[0];
    if (!item) return null;
    return { collectionId: pageCollectionId, id: item.id, data: item.data };
  }, [mode, pageCollectionId, collections]);

  // The Inspector's "Bind" toggle (docs/collections.md) only offers a
  // `currentItem` binding when it knows a `currentItem` will actually
  // exist at render time — otherwise it defaults to a *fixed* single-item
  // binding (always item[0], never varying), which is correct for a
  // dynamic/repeater page (`pageCollectionId` above) but wrong for a field
  // nested inside a "list" block's own item template, which supplies its
  // own per-repeat `currentItem` regardless of the page. Walks up from the
  // selection to find the nearest ancestor "list" and its collectionId,
  // taking priority over the page's own binding since it's the more local
  // repeating context.
  const nearestListCollectionId = useMemo(() => {
    if (!selectedId) return null;
    let id = selectedId;
    for (let i = 0; i < 50; i++) {
      const parent = findParent(content.root, id);
      if (!parent) return null;
      if (parent.type === "list" && typeof parent.props.collectionId === "string" && parent.props.collectionId) {
        return parent.props.collectionId;
      }
      id = parent.id;
    }
    return null;
  }, [content.root, selectedId]);

  const renderContextValue = useMemo<RenderContext>(
    () => ({
      device: activeBreakpoint === "base" ? "desktop" : activeBreakpoint,
      siteId,
      pageId: mode === "page" ? pageId : undefined,
      collectionItems,
      currentItem,
      // Same shared resolution as the public renderer (lib/translations.ts)
      // — the canvas preview shows translated content under a selected
      // Locale exactly like a visitor would see it, never a separate
      // "editor preview" rendering path.
      localeId: activeLocale?.id ?? null,
      translations,
      translationEntity: { type: translationEntityType, id: pageId },
    }),
    [activeBreakpoint, siteId, pageId, mode, collectionItems, currentItem, activeLocale, translations, translationEntityType],
  );

  // Composed preview for header/footer Templates only — mirrors
  // PublishedPage.tsx's composition so the editor and public renderer never
  // fork (AGENTS.md "one shared render codepath"). The Template being
  // edited stays the live/interactive `content.root`; the sample page and
  // the opposite slot are read-only context rendered through the same
  // BlockRenderer with no selection props.
  const showComposedPreview = mode === "template" && (templateType === "header" || templateType === "footer") && Boolean(compositionPage);
  const otherSlotType = templateType === "header" ? "footer" : "header";
  const otherSlotTemplate = useMemo(
    () => (showComposedPreview ? resolveTemplate(siteTemplates, otherSlotType, renderContextValue) : null),
    [showComposedPreview, siteTemplates, otherSlotType, renderContextValue],
  );
  const bodyTemplate = useMemo(
    () => (showComposedPreview ? resolveTemplate(siteTemplates, "pageTemplate", renderContextValue) : null),
    [showComposedPreview, siteTemplates, renderContextValue],
  );
  const bodyRoot = bodyTemplate ? (bodyTemplate.content as PageContent).root : (compositionPage?.root ?? null);

  const renderNodeWrapper = useCallback(
    (block: Block, node: ReactNode, isRoot: boolean) => (
      <DragHandleWrapper
        block={block}
        isRoot={isRoot}
        readOnly={readOnly}
        onSelect={selectBlock}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onSaveAsBlock={handleSaveAsBlock}
      >
        {node}
      </DragHandleWrapper>
    ),
    [readOnly, selectBlock, handleDelete, handleDuplicate, handleSaveAsBlock],
  );

  const renderChildrenWrapper = useCallback(
    (container: Block, childNodes: ReactNode[], childBlocks: Block[]) => (
      <DropSlotList containerId={container.id} childNodes={childNodes} childBlocks={childBlocks} />
    ),
    [],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <CustomFontStyles fonts={customFonts} />
      <div className="flex h-screen flex-col">
        <Toolbar
          siteId={siteId}
          pageId={pageId}
          pageTitle={pageTitle}
          mode={mode}
          backHref={backHref}
          onDelete={handleDelete}
          canDelete={Boolean(selectedId && selectedId !== content.root.id) && !readOnly}
          onPublish={handlePublish}
          publishing={publishing}
          canPublish={canPublish}
          saveStatus={saveStatus}
          activeBreakpoint={activeBreakpoint}
          onBreakpointChange={setActiveBreakpoint}
          locales={locales}
          activeLocaleId={activeLocaleId}
          onLocaleChange={setActiveLocaleId}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo && !readOnly}
          canRedo={canRedo && !readOnly}
          canSaveAsBlock={Boolean(selectedId) && !readOnly}
          onSaveAsBlock={handleSaveAsBlock}
          readOnly={readOnly}
          onRestore={handleRestore}
          extraToolbar={extraToolbar}
          layersOpen={layersOpen}
          onToggleLayers={() => setLayersOpen((v) => !v)}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((v) => !v)}
          simpleMode={simpleMode}
          onToggleSimpleMode={toggleSimpleMode}
        />
        <div className="relative flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto bg-[var(--surface-sunken)] p-6" onClick={() => selectBlock(null)}>
            {/* overflow-x-hidden clips full-bleed blocks (e.g. "hero"'s 100vw
                breakout, see registry.tsx) to this simulated-breakpoint
                frame during editing — the real published page has no such
                frame, so it stays genuinely edge-to-edge there. */}
            <div className="mx-auto overflow-x-hidden bg-white shadow-sm" style={{ maxWidth: `${canvasWidth}px` }}>
              {showComposedPreview ? (
                <>
                  {templateType === "header" ? (
                    <BlockRenderer
                      block={content.root}
                      selectedId={selectedId}
                      onSelect={selectBlock}
                      activeBreakpoint={activeBreakpoint}
                      theme={theme}
                      renderContext={renderContextValue}
                      renderNodeWrapper={renderNodeWrapper}
                      renderChildrenWrapper={renderChildrenWrapper}
                      isRoot
                    />
                  ) : (
                    otherSlotTemplate && (
                      <BlockRenderer
                        block={(otherSlotTemplate.content as PageContent).root}
                        theme={theme}
                        renderContext={renderContextValue}
                        isRoot
                      />
                    )
                  )}
                  {bodyRoot && <BlockRenderer block={bodyRoot} theme={theme} renderContext={renderContextValue} isRoot />}
                  {templateType === "footer" ? (
                    <BlockRenderer
                      block={content.root}
                      selectedId={selectedId}
                      onSelect={selectBlock}
                      activeBreakpoint={activeBreakpoint}
                      theme={theme}
                      renderContext={renderContextValue}
                      renderNodeWrapper={renderNodeWrapper}
                      renderChildrenWrapper={renderChildrenWrapper}
                      isRoot
                    />
                  ) : (
                    otherSlotTemplate && (
                      <BlockRenderer
                        block={(otherSlotTemplate.content as PageContent).root}
                        theme={theme}
                        renderContext={renderContextValue}
                        isRoot
                      />
                    )
                  )}
                </>
              ) : (
                <BlockRenderer
                  block={content.root}
                  selectedId={selectedId}
                  onSelect={selectBlock}
                  activeBreakpoint={activeBreakpoint}
                  theme={theme}
                  renderContext={renderContextValue}
                  renderNodeWrapper={renderNodeWrapper}
                  renderChildrenWrapper={renderChildrenWrapper}
                  isRoot
                />
              )}
              {mode === "template" && (templateType === "header" || templateType === "footer") && !compositionPage && (
                <p className="p-2 text-center text-xs text-gray-400">
                  No pages exist on this site yet — showing the template in isolation.
                </p>
              )}
            </div>
          </div>

          {layersOpen && (
            <FloatingPanel
              title="Layers"
              onClose={() => setLayersOpen(false)}
              className="absolute left-3 top-3 bottom-3 z-20 w-64"
            >
              {!readOnly && (
                <div className="border-b border-[var(--border)] p-3">
                  <button onClick={() => setSectionPickerOpen(true)} className="chrome-btn chrome-btn-primary w-full !py-1.5 text-xs">
                    Add a section…
                  </button>
                  <p className="mt-3 mb-1.5 text-xs font-medium text-[var(--text-muted)]">Add block</p>
                  <div className="flex flex-wrap gap-1.5">
                    {getAllBlockDefinitions().map((def) => (
                      <PaletteItem key={def.type} type={def.type} label={def.label} onAdd={handleAdd} />
                    ))}
                  </div>
                  {savedBlocks.length > 0 && (
                    <>
                      <p className="mt-3 mb-1.5 text-xs font-medium text-[var(--text-muted)]">Insert saved block</p>
                      <div className="flex flex-wrap gap-1.5">
                        {savedBlocks.map((saved) => (
                          <button
                            key={saved.id}
                            onClick={() => handleInsertSavedBlock(saved)}
                            className="chrome-btn chrome-btn-secondary !py-1 text-xs"
                            title="Insert a copy"
                          >
                            {saved.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <LayersPanel root={content.root} selectedId={selectedId} onSelect={selectBlock} />
            </FloatingPanel>
          )}

          {panelOpen && !readOnly && (
            <FloatingPanel
              title={rightTab === "inspector" ? "Properties" : rightTab === "clipboard" ? "Import" : "SEO"}
              onClose={() => setPanelOpen(false)}
              className="absolute right-3 top-3 bottom-3 z-20 w-80"
              headerExtra={
                <div className="flex gap-1">
                  <button
                    onClick={() => setRightTab("inspector")}
                    className={`chrome-tab !px-2 !py-1 ${rightTab === "inspector" ? "" : "opacity-60"}`}
                    data-state={rightTab === "inspector" ? "active" : undefined}
                  >
                    Properties
                  </button>
                  <button
                    onClick={() => setRightTab("clipboard")}
                    className={`chrome-tab !px-2 !py-1 ${rightTab === "clipboard" ? "" : "opacity-60"}`}
                    data-state={rightTab === "clipboard" ? "active" : undefined}
                  >
                    Import
                  </button>
                  {mode === "page" && (
                    <button
                      onClick={() => setRightTab("seo")}
                      className={`chrome-tab !px-2 !py-1 ${rightTab === "seo" ? "" : "opacity-60"}`}
                      data-state={rightTab === "seo" ? "active" : undefined}
                    >
                      SEO
                    </button>
                  )}
                </div>
              }
            >
              {rightTab === "clipboard" ? (
                <ClipboardPanel siteId={siteId} selectedBlock={selectedBlock} onInsert={handleInsertFragment} />
              ) : rightTab === "seo" && mode === "page" ? (
                <SeoPanel seo={seo} onChange={handleSeoChange} readOnly={readOnly} />
              ) : (
                <Inspector
                  block={selectedBlock}
                  siteId={siteId}
                  activeBreakpoint={activeBreakpoint}
                  theme={theme}
                  onChange={handleChange}
                  collections={collections}
                  customFonts={customFonts}
                  pageCollectionId={nearestListCollectionId ?? pageCollectionId}
                  readOnly={readOnly}
                  simpleMode={simpleMode}
                  activeLocale={activeLocale ? { id: activeLocale.id, isDefault: activeLocale.isDefault } : null}
                  translationEntity={{ type: translationEntityType, id: pageId }}
                  translations={translations}
                  onTranslationChange={handleTranslationChange}
                  onTranslationClear={handleTranslationClear}
                />
              )}
            </FloatingPanel>
          )}
        </div>
      </div>
      {!readOnly && (
        <SectionPicker open={sectionPickerOpen} onOpenChange={setSectionPickerOpen} onInsert={handleInsertSectionPreset} />
      )}
    </DndContext>
  );
}
