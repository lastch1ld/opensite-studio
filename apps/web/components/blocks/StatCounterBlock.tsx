"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import type { CSSProperties } from "react";

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

// Count-up-on-scroll number (docs/reference-sites-plan.md Tier 1, seen on
// rareformhealth.co). `motion` is already a dependency (BlockRenderer.tsx's
// scroll-in animations) — `animate()` interpolates a plain number, driven
// into state on every frame, once the element scrolls into view.
export function StatCounterBlock({
  value,
  prefix,
  suffix,
  label,
  style,
}: {
  value: string;
  prefix: string;
  suffix: string;
  label: string;
  style: Record<string, unknown>;
}) {
  const target = Number(value) || 0;
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, target, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, target]);

  return (
    <div style={{ textAlign: str(style.align, "center") as CSSProperties["textAlign"] }}>
      <span
        ref={ref}
        style={{
          display: "inline-block",
          fontSize: str(style.valueFontSize, "48px"),
          fontWeight: 700,
          color: str(style.valueColor, "#111111"),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {prefix}
        {display}
        {suffix}
      </span>
      {label && (
        <div style={{ marginTop: "6px", fontSize: "15px", color: str(style.labelColor, "#6b7280") }}>{label}</div>
      )}
    </div>
  );
}
