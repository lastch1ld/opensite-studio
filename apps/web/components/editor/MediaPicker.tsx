"use client";

import { useEffect, useRef, useState } from "react";

type MediaItem = {
  id: string;
  url: string;
  mimeType: string;
  altText: string | null;
};

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="max-h-[80vh] w-[560px] overflow-y-auto rounded bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Media library</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
            Close
          </button>
        </div>
        <label className="mb-3 block w-fit cursor-pointer rounded border px-3 py-1 text-sm hover:bg-gray-50">
          {uploading ? "Uploading..." : "Upload new image"}
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">No uploads yet.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.url)}
                className="aspect-square overflow-hidden rounded border hover:ring-2 hover:ring-blue-500"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.altText ?? ""} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
