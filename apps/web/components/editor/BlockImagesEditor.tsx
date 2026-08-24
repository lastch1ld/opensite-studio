"use client";

import { useState } from "react";
import type { BlockImage } from "@/components/blocks/types";
import { MediaPicker } from "./MediaPicker";

function newImage(): BlockImage {
  return { id: crypto.randomUUID(), src: "https://placehold.co/800x600", alt: "" };
}

// Shared image-list editor for the `gallery` and `slider` blocks
// (docs/starter-templates.md's Aperture port) — add/remove/reorder
// src+alt+caption rows, same shape as AccordionItemsEditor/
// ContentSwitcherItemsEditor, plus a "Choose" button wired to the same
// MediaPicker the generic "image" FieldInput uses instead of a raw URL
// field only.
export function BlockImagesEditor({
  images,
  siteId,
  onChange,
  readOnly = false,
}: {
  images: BlockImage[];
  siteId: string;
  onChange: (images: BlockImage[]) => void;
  readOnly?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mediaPickerFor, setMediaPickerFor] = useState<string | null>(null);

  function updateImage(id: string, patch: Partial<BlockImage>) {
    if (readOnly) return;
    onChange(images.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  }

  function removeImage(id: string) {
    if (readOnly) return;
    onChange(images.filter((img) => img.id !== id));
  }

  function moveImage(id: string, dir: -1 | 1) {
    if (readOnly) return;
    const index = images.findIndex((img) => img.id === id);
    const target = index + dir;
    if (index === -1 || target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="chrome-label !mb-0">Images</label>
        <button
          onClick={() => onChange([...images, newImage()])}
          disabled={readOnly}
          className="chrome-btn chrome-btn-secondary !py-1 text-xs"
        >
          + Add image
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {images.map((image, i) => (
          <div key={image.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] p-2">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setExpandedId(expandedId === image.id ? null : image.id)}
                className="min-w-0 flex-1 truncate text-left text-xs font-medium text-[var(--text)]"
              >
                {image.alt || image.caption || "(untitled image)"}
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => moveImage(image.id, -1)} disabled={i === 0 || readOnly} className="px-1 text-xs disabled:opacity-30">
                  ↑
                </button>
                <button
                  onClick={() => moveImage(image.id, 1)}
                  disabled={i === images.length - 1 || readOnly}
                  className="px-1 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button onClick={() => removeImage(image.id)} disabled={readOnly} className="px-1 text-xs text-red-600 disabled:opacity-30">
                  ✕
                </button>
              </div>
            </div>
            {expandedId === image.id && (
              <div className="mt-2 flex flex-col gap-2">
                {image.src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.src} alt="" className="h-24 w-full rounded-[var(--radius-sm)] border border-[var(--border)] object-cover" />
                )}
                <div className="flex gap-2">
                  <input
                    value={image.src}
                    onChange={(e) => updateImage(image.id, { src: e.target.value })}
                    placeholder="Image URL"
                    disabled={readOnly}
                    className="chrome-input w-full text-xs"
                  />
                  <button
                    onClick={() => setMediaPickerFor(image.id)}
                    disabled={readOnly}
                    className="chrome-btn chrome-btn-secondary shrink-0 !px-2 !py-1 text-xs"
                  >
                    Choose
                  </button>
                </div>
                <input
                  value={image.alt}
                  onChange={(e) => updateImage(image.id, { alt: e.target.value })}
                  placeholder="Alt text"
                  disabled={readOnly}
                  className="chrome-input w-full text-xs"
                />
                <input
                  value={image.caption ?? ""}
                  onChange={(e) => updateImage(image.id, { caption: e.target.value })}
                  placeholder="Caption (optional)"
                  disabled={readOnly}
                  className="chrome-input w-full text-xs"
                />
              </div>
            )}
          </div>
        ))}
        {images.length === 0 && <p className="text-xs text-[var(--text-faint)]">No images yet.</p>}
      </div>
      {mediaPickerFor && (
        <MediaPicker
          siteId={siteId}
          onClose={() => setMediaPickerFor(null)}
          onSelect={(url) => {
            updateImage(mediaPickerFor, { src: url });
            setMediaPickerFor(null);
          }}
        />
      )}
    </div>
  );
}
