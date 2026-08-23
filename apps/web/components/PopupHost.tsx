"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { PageContent } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";
import type { RenderContext } from "@/lib/bind";
import type { PopupSettings } from "@/lib/popupTrigger";
import { evaluateCondition } from "@/lib/condition";

export type PopupSpec = { id: string; content: PageContent; settings: PopupSettings; renderContext?: RenderContext };

function dismissalKey(popupId: string): string {
  return `opensite:popup:${popupId}:dismissed`;
}

// Client-side "have we shown this before" check, per docs/popups-and-modals.md's
// frequency control (localStorage/sessionStorage keyed by popup id — no
// server round-trip). Doesn't gate on cookie-banner consent yet since that
// mechanism (integrations.md) isn't built in this codebase yet.
function isDismissed(settings: PopupSettings, popupId: string): boolean {
  if (settings.frequency.mode === "everyTime") return false;
  if (settings.frequency.mode === "oncePerSession") {
    return sessionStorage.getItem(dismissalKey(popupId)) === "1";
  }
  const raw = localStorage.getItem(dismissalKey(popupId));
  if (!raw) return false;
  const days = settings.frequency.days;
  const elapsedMs = Date.now() - Number(raw);
  return elapsedMs < days * 24 * 60 * 60 * 1000;
}

function recordDismissal(settings: PopupSettings, popupId: string) {
  if (settings.frequency.mode === "everyTime") return;
  if (settings.frequency.mode === "oncePerSession") {
    sessionStorage.setItem(dismissalKey(popupId), "1");
  } else {
    localStorage.setItem(dismissalKey(popupId), String(Date.now()));
  }
}

function SinglePopup({
  popup,
  theme,
  ctx,
}: {
  popup: PopupSpec;
  theme: ThemeTokens | null;
  ctx: RenderContext;
}) {
  const [open, setOpen] = useState(false);
  const openedRef = useRef(false);

  function tryOpen() {
    if (openedRef.current || isDismissed(popup.settings, popup.id)) return;
    openedRef.current = true;
    setOpen(true);
  }

  function close() {
    setOpen(false);
    recordDismissal(popup.settings, popup.id);
  }

  useEffect(() => {
    const { trigger } = popup.settings;
    if (trigger.type === "pageLoad") {
      const timer = setTimeout(tryOpen, (trigger.delaySeconds ?? 0) * 1000);
      return () => clearTimeout(timer);
    }
    if (trigger.type === "scrollPercent") {
      const onScroll = () => {
        const doc = document.documentElement;
        const scrolled = (window.scrollY / Math.max(doc.scrollHeight - window.innerHeight, 1)) * 100;
        if (scrolled >= trigger.percent) tryOpen();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
    if (trigger.type === "exitIntent") {
      const onMouseOut = (e: MouseEvent) => {
        if (e.clientY <= 0) tryOpen();
      };
      document.addEventListener("mouseout", onMouseOut);
      return () => document.removeEventListener("mouseout", onMouseOut);
    }
    if (trigger.type === "elementClick") {
      const onClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest(`[data-block-id="${trigger.blockId}"]`)) tryOpen();
      };
      document.addEventListener("click", onClick);
      return () => document.removeEventListener("click", onClick);
    }
    if (trigger.type === "collectionFieldEquals") {
      if (evaluateCondition(trigger, ctx)) tryOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open || !popup.settings.closeOnEscape) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && popup.settings.closeOnOutsideClick) close();
      }}
      onClickCapture={(e) => {
        const target = e.target as HTMLElement | null;
        if (popup.settings.closeOnButton && target?.closest('[data-close-popup="true"]')) close();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div style={{ background: "#fff", maxWidth: "90vw", maxHeight: "90vh", overflow: "auto" }}>
        <BlockRenderer block={popup.content.root} theme={theme} renderContext={ctx} isRoot />
      </div>
    </div>,
    document.body,
  );
}

// Thin client component layering trigger-driven mount/unmount on top of the
// shared BlockRenderer — a popup is still rendered through the same
// codepath as everything else, just inside an overlay portal instead of
// document flow (docs/popups-and-modals.md).
export function PopupHost({
  popups,
  theme,
  renderContext,
}: {
  popups: PopupSpec[];
  theme: ThemeTokens | null;
  renderContext: RenderContext;
}) {
  if (!popups.length) return null;
  return (
    <>
      {popups.map((popup) => (
        <SinglePopup key={popup.id} popup={popup} theme={theme} ctx={popup.renderContext ?? renderContext} />
      ))}
    </>
  );
}
