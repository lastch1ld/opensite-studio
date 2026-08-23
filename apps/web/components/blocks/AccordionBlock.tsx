"use client";

import * as Accordion from "@radix-ui/react-accordion";
import type { CSSProperties } from "react";
import type { AccordionItem } from "./types";

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

// Real expand/collapse (docs/reference-sites-plan.md Tier 1: FAQ is the
// single most common pattern across the 13 reference sites, 7/13, and the
// existing "FAQ Section" preset is static stacked text, not interactive).
// @radix-ui/react-accordion — same primitive family already used elsewhere
// in the editor (Tabs, Dialog, ToggleGroup, ContextMenu).
export function AccordionBlock({
  items,
  allowMultiple,
  style,
}: {
  items: AccordionItem[];
  allowMultiple: boolean;
  style: Record<string, unknown>;
}) {
  const borderColor = str(style.borderColor, "#e5e7eb");
  const triggerStyle: CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "16px 4px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    font: "inherit",
    fontSize: str(style.fontSize, "16px"),
    fontWeight: str(style.fontWeight, "600") as CSSProperties["fontWeight"],
    color: str(style.titleColor, "#111111"),
    textAlign: "left",
  };
  const contentStyle: CSSProperties = {
    padding: "0 4px 16px",
    fontSize: "15px",
    lineHeight: 1.6,
    color: str(style.contentColor, "#4b5563"),
    whiteSpace: "pre-wrap",
  };

  if (items.length === 0) {
    return <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>No FAQ items yet — add some in the Properties panel.</p>;
  }

  // Radix's `type` prop shape genuinely differs between "single"
  // (collapsible is optional) and "multiple" (no collapsible prop at all),
  // so the two calls can't share one prop object without an `as any`.
  return allowMultiple ? (
    <Accordion.Root type="multiple" style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item) => (
        <Accordion.Item key={item.id} value={item.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
          <Accordion.Header>
            <Accordion.Trigger className="opensite-accordion-trigger" style={triggerStyle}>
              <span>{item.question}</span>
              <span aria-hidden className="opensite-accordion-chevron">
                ▾
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content style={contentStyle}>{item.answer}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ) : (
    <Accordion.Root type="single" collapsible style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item) => (
        <Accordion.Item key={item.id} value={item.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
          <Accordion.Header>
            <Accordion.Trigger className="opensite-accordion-trigger" style={triggerStyle}>
              <span>{item.question}</span>
              <span aria-hidden className="opensite-accordion-chevron">
                ▾
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content style={contentStyle}>{item.answer}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
