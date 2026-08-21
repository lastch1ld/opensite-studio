"use client";

import { useState } from "react";
import type { Block } from "@/components/blocks/types";

export type ContentFragment = {
  id: string;
  semanticType: "heading" | "paragraph" | "listItem" | "quote" | "caption";
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  html?: string;
  sourceSection?: string;
};

// Which block types have a single text-bearing prop a fragment can be
// inserted into, and which prop key that is. Kept to the two block types
// that are actually plain-text containers today — extending this to more
// block types is a registry-level decision, not this feature's.
const TEXT_TARGET_PROP: Partial<Record<Block["type"], string>> = {
  text: "content",
  heading: "text",
};

const TYPE_BADGE: Record<ContentFragment["semanticType"], string> = {
  heading: "H",
  paragraph: "P",
  listItem: "LI",
  quote: "Quote",
  caption: "Caption",
};

export function ClipboardPanel({
  siteId,
  selectedBlock,
  initialUrl,
  onInsert,
}: {
  siteId: string;
  selectedBlock: Block | null;
  initialUrl?: string;
  onInsert: (propKey: string, text: string) => void;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [fragments, setFragments] = useState<ContentFragment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/sites/${siteId}/import/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to fetch.");
      return;
    }
    setFragments(data.fragments as ContentFragment[]);
  }

  const targetProp = selectedBlock ? TEXT_TARGET_PROP[selectedBlock.type] : undefined;

  const grouped = new Map<string, ContentFragment[]>();
  for (const f of fragments ?? []) {
    const key = f.sourceSection ?? "";
    grouped.set(key, [...(grouped.get(key) ?? []), f]);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto border-l bg-white p-4">
      <h2 className="text-xs font-semibold uppercase text-gray-500">Content clipboard</h2>
      <p className="mt-1 text-xs text-gray-500">
        Fetch an old page&apos;s text, then click a fragment to insert it into the currently selected block. This
        doesn&apos;t stay linked to the source — it&apos;s a one-time snapshot per fetch.
      </p>

      <form onSubmit={handleFetch} className="mt-3 flex gap-2">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://old-site.com/about"
          className="w-full rounded border px-2 py-1 text-xs"
        />
        <button type="submit" disabled={loading} className="whitespace-nowrap rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50">
          {loading ? "Fetching..." : "Fetch"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-2 rounded border border-dashed px-2 py-1 text-xs text-gray-500">
        {selectedBlock
          ? targetProp
            ? `Inserting into the selected ${selectedBlock.type} block.`
            : `Selected block (${selectedBlock.type}) isn't a text-bearing block — select a text or heading block to insert.`
          : "Select a block on the canvas to enable insert."}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {[...grouped.entries()].map(([section, items]) => (
          <div key={section}>
            {section && <p className="mb-1 text-xs font-medium text-gray-400">{section}</p>}
            <ul className="flex flex-col gap-1">
              {items.map((fragment) => (
                <li key={fragment.id}>
                  <button
                    disabled={!targetProp}
                    onClick={() => targetProp && onInsert(targetProp, fragment.text)}
                    title={targetProp ? "Insert into selected block" : "Select a text-bearing block first"}
                    className="flex w-full items-start gap-2 rounded border px-2 py-1 text-left text-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="mt-0.5 shrink-0 rounded bg-gray-100 px-1 text-[10px] font-semibold text-gray-500">
                      {fragment.semanticType === "heading" && fragment.headingLevel
                        ? `H${fragment.headingLevel}`
                        : TYPE_BADGE[fragment.semanticType]}
                    </span>
                    <span className="truncate">{fragment.text.slice(0, 140)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {fragments && fragments.length === 0 && <p className="text-xs text-gray-500">No text fragments found.</p>}
      </div>
    </div>
  );
}
