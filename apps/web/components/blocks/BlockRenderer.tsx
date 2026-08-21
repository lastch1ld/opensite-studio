"use client";

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import type { Block, Breakpoint } from "./types";
import { blockRegistry } from "./registry";
import { buildResponsiveCss, resolveStyle, resolveTokens } from "@/lib/responsiveStyle";
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
  // Editor-only hooks: wrap a block's rendered node (e.g. to add a drag
  // handle) or wrap a container's children (e.g. to interleave drop
  // targets). Public renderer never passes these, so its output is
  // untouched — same render tree, same registry `render()` calls.
  renderNodeWrapper?: (block: Block, node: ReactNode, isRoot: boolean) => ReactNode;
  renderChildrenWrapper?: (container: Block, childNodes: ReactNode[], childBlocks: Block[]) => ReactNode;
  isRoot?: boolean;
};

// Editor canvas and public renderer both call this component with the same
// block tree. `onSelect`/`selectedId` are only passed by the editor, so the
// public renderer gets identical markup with zero selection chrome.
export function BlockRenderer({
  block,
  selectedId,
  onSelect,
  activeBreakpoint = "base",
  theme = null,
  renderNodeWrapper,
  renderChildrenWrapper,
  isRoot = false,
}: BlockRendererProps) {
  const def = blockRegistry[block.type];
  if (!def) return null;

  const childBlocks = block.children ?? [];
  const childNodes = childBlocks.map((child) => (
    <BlockRenderer
      key={child.id}
      block={child}
      selectedId={selectedId}
      onSelect={onSelect}
      activeBreakpoint={activeBreakpoint}
      theme={theme}
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

  const resolvedStyle = resolveTokens(resolveStyle(block.style, activeBreakpoint), theme);
  // Only the public renderer (no onSelect) needs generated media-query CSS;
  // the editor just re-renders the resolved style for whichever breakpoint
  // is active, since its canvas isn't a real responsive viewport.
  const responsiveCss = onSelect ? null : buildResponsiveCss(block.id, block.style, theme);

  const rawContent = def.render(block.props, resolvedStyle, childrenContent);
  const content =
    responsiveCss && isValidElement(rawContent)
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
