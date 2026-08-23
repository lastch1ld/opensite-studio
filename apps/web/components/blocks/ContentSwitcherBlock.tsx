"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { ContentSwitcherItem } from "./types";

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

// docs/reference-sites-plan.md Tier 2: click/hover a list item, a paired
// panel updates (Accoutrement's curator name list -> portrait swap,
// GrowthSync's use-case cards -> demo swap). Client-side state lives
// entirely inside this one block's render — no cross-block architecture
// needed. `.opensite-switcher-grid`'s mobile stacking rule is defined once
// globally (app/globals.css), same pattern as the marquee/accordion blocks.
export function ContentSwitcherBlock({
  items,
  style,
}: {
  items: ContentSwitcherItem[];
  style: Record<string, unknown>;
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const active = items.find((item) => item.id === activeId) ?? items[0];

  if (items.length === 0) {
    return <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>No items yet — add some in the Properties panel.</p>;
  }

  const activeColor = str(style.activeColor, "#111111");
  const inactiveColor = str(style.inactiveColor, "#9ca3af");

  return (
    <div className="opensite-switcher-grid" style={{ gap: str(style.gap, "32px"), alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item) => {
          const isActive = item.id === active?.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              onMouseEnter={() => setActiveId(item.id)}
              style={{
                textAlign: "left",
                padding: "14px 4px",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid #e5e7eb",
                cursor: "pointer",
                font: "inherit",
                fontSize: "17px",
                fontWeight: isActive ? 700 : 400,
                color: isActive ? activeColor : inactiveColor,
                transition: "color 0.15s ease, font-weight 0.15s ease",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "12px",
          aspectRatio: str(style.imageAspectRatio, "4 / 5"),
          background: "#f3f4f6",
        }}
      >
        {active?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={active.id}
            src={active.image}
            alt={active.label}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } as CSSProperties}
          />
        )}
        {active?.description && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "16px",
              background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
              color: "#ffffff",
              fontSize: "14px",
            }}
          >
            {active.description}
          </div>
        )}
      </div>
    </div>
  );
}
