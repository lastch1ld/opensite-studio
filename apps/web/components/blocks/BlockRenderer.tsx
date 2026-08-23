"use client";

import { cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from "react";
import type { Block, Breakpoint } from "./types";
import { getBlockDefinition } from "./registry";
import { buildResponsiveCss, resolveStyle, resolveTokens } from "@/lib/responsiveStyle";
import { queryListItems, resolveBoundProps, type RenderContext } from "@/lib/bind";
import { evaluateCondition } from "@/lib/condition";
import { resolveTranslatedProps } from "@/lib/translations";
import type { ThemeTokens } from "@/lib/theme";

type BlockRendererProps = {
  block: Block;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  activeBreakpoint?: Breakpoint;
  // Theme to resolve `{ $token: ... }` style values against. Null renders
  // token refs' fallback (undefined -> block's own default) — same path
  // for editor canvas and public renderer, just fed a different theme.
  theme?: ThemeTokens | null;
  // Collection data + current repeater item to resolve `{ $bind: ... }`
  // props and `condition`s against (see lib/bind.ts, lib/condition.ts). If
  // omitted, device is derived from activeBreakpoint and no collection data
  // is available — same as an empty context.
  renderContext?: RenderContext;
  // Editor-only hooks: wrap a block's rendered node (e.g. to add a drag
  // handle) or wrap a container's children (e.g. to interleave drop
  // targets). Public renderer never passes these, so its output is
  // untouched — same render tree, same registry `render()` calls.
  renderNodeWrapper?: (block: Block, node: ReactNode, isRoot: boolean) => ReactNode;
  renderChildrenWrapper?: (container: Block, childNodes: ReactNode[], childBlocks: Block[]) => ReactNode;
  isRoot?: boolean;
};

function deviceFor(breakpoint: Breakpoint): RenderContext["device"] {
  return breakpoint === "base" ? "desktop" : breakpoint;
}

// Editor canvas and public renderer both call this component with the same
// block tree. `onSelect`/`selectedId` are only passed by the editor, so the
// public renderer gets identical markup with zero selection chrome.
export function BlockRenderer({
  block,
  selectedId,
  onSelect,
  activeBreakpoint = "base",
  theme = null,
  renderContext,
  renderNodeWrapper,
  renderChildrenWrapper,
  isRoot = false,
}: BlockRendererProps) {
  const def = getBlockDefinition<RenderContext>(block.type);
  if (!def) return null;

  const ctx: RenderContext = renderContext ?? { device: deviceFor(activeBreakpoint) };
  if (!evaluateCondition(block.condition, ctx)) return null;

  const childBlocks = block.children ?? [];
  const resolvedStyle = resolveTokens(resolveStyle(block.style, activeBreakpoint), theme);

  // A list/grid block repeats its child subtree once per matched
  // CollectionItem instead of rendering `children` once through the
  // registry's `render()` (docs/collections.md) — bypasses the normal
  // single-pass content build below, but still goes through this same
  // BlockRenderer for every repeated instance (recursive call per item).
  if (block.type === "list") {
    const collectionId = typeof block.props.collectionId === "string" ? block.props.collectionId : "";
    const allItems = ctx.collectionItems?.[collectionId] ?? [];
    const matched = queryListItems(allItems, block.props);
    // With no matched items, still render one empty pass so the template
    // subtree stays visible/selectable in the editor.
    const instances = matched.length ? matched : [null];
    const cssStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: String(resolvedStyle.gap ?? "16px") };
    const content = (
      <div style={cssStyle} data-block-id={block.id}>
        {instances.map((item, i) => (
          <div key={item?.id ?? `empty-${i}`}>
            {childBlocks.map((child) => (
              <BlockRenderer
                key={child.id}
                block={child}
                selectedId={selectedId}
                onSelect={onSelect}
                activeBreakpoint={activeBreakpoint}
                theme={theme}
                renderContext={{ ...ctx, currentItem: item ? { collectionId, id: item.id, data: item.data } : null }}
                renderNodeWrapper={renderNodeWrapper}
                renderChildrenWrapper={renderChildrenWrapper}
              />
            ))}
          </div>
        ))}
      </div>
    );
    if (!onSelect) return <>{content}</>;
    const isSelected = block.id === selectedId;
    const selectionNode = (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect(block.id);
        }}
        style={{ outline: isSelected ? "2px solid #2563eb" : "1px dashed transparent", outlineOffset: "-1px", cursor: "pointer", position: "relative" }}
      >
        {content}
      </div>
    );
    return renderNodeWrapper ? renderNodeWrapper(block, selectionNode, isRoot) : selectionNode;
  }

  const childNodes = childBlocks.map((child) => (
    <BlockRenderer
      key={child.id}
      block={child}
      selectedId={selectedId}
      onSelect={onSelect}
      activeBreakpoint={activeBreakpoint}
      theme={theme}
      renderContext={ctx}
      renderNodeWrapper={renderNodeWrapper}
      renderChildrenWrapper={renderChildrenWrapper}
    />
  ));

  const childrenContent = block.children
    ? renderChildrenWrapper
      ? renderChildrenWrapper(block, childNodes, childBlocks)
      : childNodes.length
        ? childNodes
        : null
    : null;

  // Only the public renderer (no onSelect) needs generated media-query CSS;
  // the editor just re-renders the resolved style for whichever breakpoint
  // is active, since its canvas isn't a real responsive viewport.
  const responsiveCss = onSelect ? null : buildResponsiveCss(block.id, block.style, theme);

  const boundProps = resolveBoundProps(block.props, ctx);
  // docs/multilingual.md: applies Translation overrides on top of $bind
  // resolution, for whichever of this block type's fields are marked
  // `translatable` — same shared resolve-through-one-function shape as
  // resolveTokens/resolveBind above, a no-op when no locale is active.
  const resolvedProps = resolveTranslatedProps(
    block.props,
    boundProps,
    def.inspector,
    ctx.translations,
    ctx.translationEntity,
    block.id,
  );
  const rawContent = def.render(resolvedProps, resolvedStyle, childrenContent, { blockId: block.id, ctx });
  // Public renderer always tags the root element with its block id (not
  // just when responsive CSS needs it) — popup elementClick triggers
  // (docs/popups-and-modals.md) delegate a click listener off this
  // attribute to find "the button/link block elsewhere on the page".
  const content =
    !onSelect && isValidElement(rawContent)
      ? cloneElement(rawContent as ReactElement<Record<string, unknown>>, { "data-block-id": block.id })
      : rawContent;

  const withCss = responsiveCss ? (
    <>
      {content}
      <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
    </>
  ) : (
    content
  );

  if (!onSelect) return <>{withCss}</>;

  const isSelected = block.id === selectedId;
  const selectionNode = (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      style={{
        outline: isSelected ? "2px solid #2563eb" : "1px dashed transparent",
        outlineOffset: "-1px",
        cursor: "pointer",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.outline = "1px dashed #94a3b8";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.outline = "1px dashed transparent";
      }}
    >
      {withCss}
    </div>
  );

  return renderNodeWrapper ? renderNodeWrapper(block, selectionNode, isRoot) : selectionNode;
}
