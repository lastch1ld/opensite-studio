"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { SECTION_PRESETS, STYLE_KITS } from "@/lib/sectionPresets";
import type { Block } from "@/components/blocks/types";

// docs/ui-ux-roadmap.md: "a bunch of nice looking preset sections ... a
// user should need to edit as least as possible" — and, per direct
// follow-up feedback, every inserted section must match whatever style
// the user is already using rather than each looking different. So this
// is a two-step picker: choose a style kit once (a palette + font
// pairing, lib/sectionPresets.ts's STYLE_KITS), then every section shown
// belongs to that same kit — never a mixed grid of clashing styles.
export function SectionPicker({
  open,
  onOpenChange,
  onInsert,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (block: Block) => void;
}) {
  const [kitId, setKitId] = useState(STYLE_KITS[0].id);
  const presets = SECTION_PRESETS.filter((p) => p.kitId === kitId);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Content className="chrome-card fixed left-1/2 top-1/2 z-[61] w-[min(92vw,820px)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
            <div>
              <Dialog.Title className="text-sm font-semibold text-[var(--text)]">Add a section</Dialog.Title>
              <Dialog.Description className="text-xs text-[var(--text-muted)]">
                Pick a style, then drop in a section — every section in a style matches the others.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]">
              <X size={16} />
            </Dialog.Close>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-5 py-3">
            {STYLE_KITS.map((kit) => (
              <button
                key={kit.id}
                onClick={() => setKitId(kit.id)}
                className={`chrome-btn !py-1.5 ${kitId === kit.id ? "chrome-btn-primary" : "chrome-btn-secondary"}`}
                title={kit.description}
              >
                {kit.name}
              </button>
            ))}
          </div>

          <div className="grid max-h-[calc(85vh-128px)] grid-cols-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onInsert(preset.build());
                  onOpenChange(false);
                }}
                className="flex flex-col items-start gap-1 rounded-[var(--radius-md)] border border-[var(--border)] p-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                <span className="text-sm font-medium text-[var(--text)]">{preset.label}</span>
                <span className="text-xs text-[var(--text-muted)]">{preset.description}</span>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
