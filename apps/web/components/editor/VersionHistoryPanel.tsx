"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { PageContent } from "@/components/blocks/types";

type Revision = {
  id: string;
  createdAt: string;
  label: string | null;
  createdBy: { id: string; name: string | null; email: string };
};

// Radix Dialog rather than the hand-rolled overlay this used to be — see
// the note in MediaPicker.tsx; same accessibility gap, same fix.
export function VersionHistoryPanel({
  siteId,
  pageId,
  canRestore,
  onRestore,
}: {
  siteId: string;
  pageId: string;
  canRestore: boolean;
  onRestore: (content: PageContent) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setLoading(true);
    const res = await fetch(`/api/sites/${siteId}/pages/${pageId}/revisions`);
    setLoading(false);
    if (res.ok) setRevisions(await res.json());
  }

  async function handleRestore(revisionId: string) {
    if (!confirm("Restore this version into the draft? You can review and re-publish afterward.")) return;
    setRestoringId(revisionId);
    const res = await fetch(`/api/sites/${siteId}/pages/${pageId}/revisions/${revisionId}/restore`, {
      method: "POST",
    });
    setRestoringId(null);
    if (!res.ok) return;
    const updated = await res.json();
    onRestore(updated.draftContent as PageContent);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger className="chrome-btn chrome-btn-secondary">History</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Content className="chrome-card fixed left-1/2 top-1/2 z-[61] max-h-[85vh] w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
            <div>
              <Dialog.Title className="text-sm font-semibold text-[var(--text)]">Version history</Dialog.Title>
              <Dialog.Description className="text-xs text-[var(--text-muted)]">
                Every publish is kept. Restoring writes into the draft, not the live page.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]">
              <X size={16} />
            </Dialog.Close>
          </div>

          <div className="max-h-[calc(85vh-72px)] overflow-y-auto px-5 py-4">
            {loading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
            {!loading && revisions.length === 0 && (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-4 py-10 text-center">
                <p className="text-sm font-medium text-[var(--text)]">No published versions yet</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Publishing this page saves a version you can come back to.
                </p>
              </div>
            )}
            <ul className="divide-y divide-[var(--border)]">
              {revisions.map((revision) => (
                <li key={revision.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--text)]">{new Date(revision.createdAt).toLocaleString()}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">
                      {revision.label ?? revision.createdBy.name ?? revision.createdBy.email}
                    </p>
                  </div>
                  {canRestore && (
                    <button
                      onClick={() => handleRestore(revision.id)}
                      disabled={restoringId === revision.id}
                      className="chrome-btn chrome-btn-secondary shrink-0"
                    >
                      {restoringId === revision.id ? "Restoring…" : "Restore"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
