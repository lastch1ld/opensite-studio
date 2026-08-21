"use client";

import type { Block } from "./types";
import { blockRegistry } from "./registry";

type BlockRendererProps = {
  block: Block;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

// Editor canvas and public renderer both call this component with the same
// block tree. `onSelect`/`selectedId` are only passed by the editor, so the
// public renderer gets identical markup with zero selection chrome.
export function BlockRenderer({ block, selectedId, onSelect }: BlockRendererProps) {
  const def = blockRegistry[block.type];
  if (!def) return null;

  const children = block.children?.length
    ? block.children.map((child) => (
        <BlockRenderer key={child.id} block={child} selectedId={selectedId} onSelect={onSelect} />
      ))
    : null;

  const content = def.render(block.props, block.style ?? {}, children);

  if (!onSelect) return <>{content}</>;

  const isSelected = block.id === selectedId;
  return (
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
      {content}
    </div>
  );
}
