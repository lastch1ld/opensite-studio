"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

// docs/ui-ux-roadmap.md: replaces the old permanent two-sidebar layout
// (a fixed Layers rail + a fixed Inspector rail) with contextual floating
// panels that appear over the canvas only while relevant, instead of
// permanently reserving screen space. EditorClient.tsx positions instances
// of this with `position: absolute` inside its canvas wrapper.
export function FloatingPanel({
  title,
  onClose,
  headerExtra,
  children,
  className = "",
}: {
  title: string;
  onClose: () => void;
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`chrome-card flex flex-col overflow-hidden ${className}`}>
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</h2>
          {headerExtra}
        </div>
        <button
          onClick={onClose}
          aria-label={`Close ${title}`}
          className="shrink-0 rounded p-0.5 text-[var(--text-faint)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]"
        >
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
