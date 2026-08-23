"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

export type FilterableGridItem = {
  key: string;
  tag: string;
  node: ReactNode;
};

// docs/reference-sites-plan.md Tier 5 (Mosaic's 18-category filter bar
// over a card grid). Every matched item is still rendered server-side
// through the normal BlockRenderer recursion (components/blocks/
// BlockRenderer.tsx's "list" branch builds `items` and hands them here) —
// this component only ever toggles which of those already-rendered nodes
// are visible, via plain `display: none`, never re-fetching or
// re-querying. `null`/empty tags never turn into a filter button (an item
// with no value for the chosen field just always shows).
export function FilterableItemsGrid({
  items,
  gridStyle,
  blockId,
}: {
  items: FilterableGridItem[];
  gridStyle: CSSProperties;
  blockId: string;
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tags = Array.from(new Set(items.map((i) => i.tag).filter(Boolean))).sort();

  function pillStyle(active: boolean): CSSProperties {
    return {
      padding: "6px 14px",
      borderRadius: "999px",
      border: `1px solid ${active ? "#111111" : "#e5e7eb"}`,
      background: active ? "#111111" : "transparent",
      color: active ? "#ffffff" : "#374151",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
    };
  }

  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          <button type="button" onClick={() => setActiveTag(null)} style={pillStyle(activeTag === null)}>
            All
          </button>
          {tags.map((tag) => (
            <button key={tag} type="button" onClick={() => setActiveTag(tag)} style={pillStyle(activeTag === tag)}>
              {tag}
            </button>
          ))}
        </div>
      )}
      <div style={gridStyle} data-block-id={blockId} data-columns-id={blockId}>
        {items.map(({ key, tag, node }) => (
          <div key={key} style={{ display: activeTag && activeTag !== tag ? "none" : undefined }}>
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}
