"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type MediaItem = {
  id: string;
  url: string;
  mimeType: string;
  altText: string | null;
};

// Radix Dialog rather than the hand-rolled overlay this used to be: the
// old version had no focus trap, no Escape handling and no `aria-modal`,
// which docs/editor-ui-stack.md flagged as a real accessibility gap.
// Follows SectionPicker.tsx's dialog shape so the editor's modals look
// and behave like one another.
export function MediaPicker({
  siteId,
  onSelect,
  onClose,
}: {
  siteId: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sites/${siteId}/media`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: MediaItem[]) => {
        if (cancelled) return;
        setItems(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [siteId, reloadToken]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/sites/${siteId}/media`, { method: "POST", body: formData });
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    if (res.ok) setReloadToken((t) => t + 1);
  }

  // Mounted only while open by its caller, so the dialog is always open
  // and closing is delegated to the caller's own state.
  return (
    <Dialog.Root open onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Content className="chrome-card fixed left-1/2 top-1/2 z-[61] max-h-[85vh] w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
            <div>
              <Dialog.Title className="text-sm font-semibold text-[var(--text)]">Media library</Dialog.Title>
              <Dialog.Description className="text-xs text-[var(--text-muted)]">
                Pick an image for this block, or upload a new one.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]">
              <X size={16} />
            </Dialog.Close>
          </div>

          <div className="max-h-[calc(85vh-72px)] overflow-y-auto p-5">
            <label className="chrome-btn chrome-btn-secondary mb-4 inline-flex w-fit cursor-pointer">
              {uploading ? "Uploading…" : "Upload new image"}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>

            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading…</p>
            ) : items.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-4 py-10 text-center">
                <p className="text-sm font-medium text-[var(--text)]">No images yet</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Anything you upload here is available to every page on this site.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.url)}
                    title={item.altText ?? "Use this image"}
                    className="aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] hover:ring-2 hover:ring-[var(--accent)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.altText ?? ""} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
