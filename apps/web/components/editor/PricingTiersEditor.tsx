"use client";

import { useState } from "react";
import type { PricingTier } from "@/components/blocks/types";

function newTier(): PricingTier {
  return {
    id: crypto.randomUUID(),
    name: "New tier",
    price: "$29",
    period: "/mo",
    features: "Feature one\nFeature two",
    ctaLabel: "Get started",
    ctaHref: "#",
    highlighted: false,
  };
}

// Tier list management for the `pricingTable` block — add/remove/reorder
// cards, edit each tier's price/features/CTA. Rendered by Inspector.tsx
// instead of the generic FieldSchema loop, same reasoning as
// FormFieldsEditor/AccordionItemsEditor: `tiers` is a list of structured
// records, not flat props.
export function PricingTiersEditor({
  tiers,
  onChange,
  readOnly = false,
}: {
  tiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
  readOnly?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateTier(id: string, patch: Partial<PricingTier>) {
    if (readOnly) return;
    onChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeTier(id: string) {
    if (readOnly) return;
    onChange(tiers.filter((t) => t.id !== id));
  }

  function moveTier(id: string, dir: -1 | 1) {
    if (readOnly) return;
    const index = tiers.findIndex((t) => t.id === id);
    const target = index + dir;
    if (index === -1 || target < 0 || target >= tiers.length) return;
    const next = [...tiers];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="chrome-label !mb-0">Tiers</label>
        <button
          onClick={() => onChange([...tiers, newTier()])}
          disabled={readOnly}
          className="chrome-btn chrome-btn-secondary !py-1 text-xs"
        >
          + Add tier
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {tiers.map((tier, i) => (
          <div key={tier.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] p-2">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setExpandedId(expandedId === tier.id ? null : tier.id)}
                className="min-w-0 flex-1 truncate text-left text-xs font-medium text-[var(--text)]"
              >
                {tier.name || "(untitled)"} {tier.highlighted && <span className="text-[var(--accent)]">★</span>}
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => moveTier(tier.id, -1)} disabled={i === 0 || readOnly} className="px-1 text-xs disabled:opacity-30">
                  ↑
                </button>
                <button
                  onClick={() => moveTier(tier.id, 1)}
                  disabled={i === tiers.length - 1 || readOnly}
                  className="px-1 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button onClick={() => removeTier(tier.id)} disabled={readOnly} className="px-1 text-xs text-red-600 disabled:opacity-30">
                  ✕
                </button>
              </div>
            </div>
            {expandedId === tier.id && (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  value={tier.name}
                  onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                  placeholder="Tier name"
                  disabled={readOnly}
                  className="chrome-input w-full text-xs"
                />
                <div className="flex gap-2">
                  <input
                    value={tier.price}
                    onChange={(e) => updateTier(tier.id, { price: e.target.value })}
                    placeholder="Price, e.g. $29"
                    disabled={readOnly}
                    className="chrome-input w-full text-xs"
                  />
                  <input
                    value={tier.period}
                    onChange={(e) => updateTier(tier.id, { period: e.target.value })}
                    placeholder="Period, e.g. /mo"
                    disabled={readOnly}
                    className="chrome-input w-full text-xs"
                  />
                </div>
                <textarea
                  value={tier.features}
                  onChange={(e) => updateTier(tier.id, { features: e.target.value })}
                  placeholder="One feature per line"
                  rows={4}
                  disabled={readOnly}
                  className="chrome-input w-full text-xs"
                />
                <div className="flex gap-2">
                  <input
                    value={tier.ctaLabel}
                    onChange={(e) => updateTier(tier.id, { ctaLabel: e.target.value })}
                    placeholder="Button label"
                    disabled={readOnly}
                    className="chrome-input w-full text-xs"
                  />
                  <input
                    value={tier.ctaHref}
                    onChange={(e) => updateTier(tier.id, { ctaHref: e.target.value })}
                    placeholder="Button link"
                    disabled={readOnly}
                    className="chrome-input w-full text-xs"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    checked={tier.highlighted}
                    onChange={(e) => updateTier(tier.id, { highlighted: e.target.checked })}
                    disabled={readOnly}
                  />
                  Featured tier (visually emphasized)
                </label>
              </div>
            )}
          </div>
        ))}
        {tiers.length === 0 && <p className="text-xs text-[var(--text-faint)]">No tiers yet.</p>}
      </div>
    </div>
  );
}
