"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { CSSProperties } from "react";

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

// docs/reference-sites-plan.md Tier 2: a drag-handle + clip-path
// before/after image comparison slider (seen on wishlabs.ai's product
// spotlight). The "before" image is clipped with `clip-path: inset()`
// rather than a width-constrained wrapper, so it never needs to know the
// container's pixel width — both images render at the container's full
// size and only the clip region changes as the handle moves. Pointer
// Events cover mouse and touch drag alike, no separate touch handlers.
export function BeforeAfterBlock({
  beforeSrc,
  afterSrc,
  beforeLabel,
  afterLabel,
  style,
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel: string;
  afterLabel: string;
  style: Record<string, unknown>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [percent, setPercent] = useState(50);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPercent(Math.min(100, Math.max(0, pct)));
  }, []);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) updateFromClientX(e.clientX);
  };
  const stopDragging = () => {
    draggingRef.current = false;
  };

  const handleColor = str(style.handleColor, "#ffffff");
  const imgStyle: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };

  if (!beforeSrc && !afterSrc) {
    return <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>Add before/after images in the Properties panel.</p>;
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerLeave={stopDragging}
      onPointerCancel={stopDragging}
      style={{
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
        touchAction: "none",
        cursor: "ew-resize",
        borderRadius: str(style.borderRadius, "0"),
        aspectRatio: str(style.aspectRatio, "16 / 9"),
        background: "#e5e7eb",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {afterSrc && <img src={afterSrc} alt={afterLabel} style={imgStyle} draggable={false} />}
      {beforeSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={beforeSrc}
          alt={beforeLabel}
          draggable={false}
          style={{ ...imgStyle, clipPath: `inset(0 ${100 - percent}% 0 0)` }}
        />
      )}
      {beforeLabel && (
        <span
          style={{ position: "absolute", top: "12px", left: "12px", padding: "4px 10px", borderRadius: "999px", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "12px", fontWeight: 600 }}
        >
          {beforeLabel}
        </span>
      )}
      {afterLabel && (
        <span
          style={{ position: "absolute", top: "12px", right: "12px", padding: "4px 10px", borderRadius: "999px", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "12px", fontWeight: 600 }}
        >
          {afterLabel}
        </span>
      )}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${percent}%`,
          width: "2px",
          transform: "translateX(-1px)",
          background: handleColor,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: `${percent}%`,
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: handleColor,
          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          fontSize: "14px",
          color: "#111111",
        }}
      >
        ↔
      </div>
    </div>
  );
}
