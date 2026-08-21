"use client";

import { useState } from "react";
import type { PageContent } from "@/components/blocks/types";

type Revision = {
  id: string;
  createdAt: string;
  label: string | null;
  createdBy: { id: string; name: string | null; email: string };
};

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

  async function handleOpen() {
    setOpen(true);
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
    <>
      <button onClick={handleOpen} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">
        History
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setOpen(false)}>
          <div className="max-h-[80vh] w-[480px] overflow-y-auto rounded bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Version history</h2>
              <button onClick={() => setOpen(false)} className="text-sm text-gray-500">
                Close
              </button>
            </div>
            {loading && <p className="mt-3 text-sm text-gray-500">Loading...</p>}
            {!loading && revisions.length === 0 && (
              <p className="mt-3 text-sm text-gray-500">No published versions yet.</p>
            )}
            <ul className="mt-3 divide-y">
              {revisions.map((revision) => (
                <li key={revision.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm">{new Date(revision.createdAt).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {revision.createdBy.name ?? revision.createdBy.email}
                    </p>
                  </div>
                  {canRestore && (
                    <button
                      onClick={() => handleRestore(revision.id)}
                      disabled={restoringId === revision.id}
                      className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                    >
                      {restoringId === revision.id ? "Restoring..." : "Restore"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
