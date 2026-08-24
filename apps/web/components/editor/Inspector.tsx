"use client";

import { useState } from "react";
import type { Block, Breakpoint, FieldSchema } from "@/components/blocks/types";
import { getBlockDefinition } from "@/components/blocks/registry";
import { tokenOptionsFor, type ThemeTokens } from "@/lib/theme";
import { translationKey } from "@/lib/translations";
import type { CollectionSummary } from "./EditorClient";
import { MediaPicker } from "./MediaPicker";
import { FormFieldsEditor } from "./FormFieldsEditor";
import { AccordionItemsEditor } from "./AccordionItemsEditor";
import { PricingTiersEditor } from "./PricingTiersEditor";
import { ContentSwitcherItemsEditor } from "./ContentSwitcherItemsEditor";
import { ComparisonTableEditor } from "./ComparisonTableEditor";
import { BlockImagesEditor } from "./BlockImagesEditor";
import type {
  AccordionItem,
  BlockImage,
  ComparisonColumn,
  ComparisonRow,
  ContentSwitcherItem,
  FormField,
  FormOnSubmit,
  PricingTier,
} from "@/components/blocks/types";
import { customFontFieldValue } from "@/lib/customFonts";
import type { CustomFont } from "@/lib/siteSettings";

// docs/multilingual.md's editor UX: when a non-default Locale is selected,
// present but not the "isDefault" one — `null` means either no Locale
// feature is configured for this site, or the default Locale is selected,
// both of which mean "edit the base Block.props as normal."
export type ActiveLocale = { id: string; isDefault: boolean } | null;

type InspectorProps = {
  block: Block | null;
  siteId: string;
  activeBreakpoint: Breakpoint;
  theme: ThemeTokens | null;
  onChange: (group: "props" | "style", key: string, value: unknown) => void;
  collections?: CollectionSummary[];
  customFonts?: CustomFont[];
  pageCollectionId?: string | null;
  readOnly?: boolean;
  // docs/ui-ux-roadmap.md's "not technical mode": swaps each field's
  // `label` for its plain-language `friendlyLabel` where one exists.
  simpleMode?: boolean;
  // The rest are all optional and only meaningful together — omitted
  // entirely by any caller that doesn't thread locale state through yet.
  activeLocale?: ActiveLocale;
  translationEntity?: { type: "page" | "template"; id: string };
  translations?: Record<string, string>;
  onTranslationChange?: (blockId: string, field: string, value: string) => void;
  onTranslationClear?: (blockId: string, field: string) => void;
};

function isTokenRef(v: unknown): v is { $token: string } {
  return typeof v === "object" && v !== null && typeof (v as { $token?: unknown }).$token === "string";
}

function isBindRef(v: unknown): v is { $bind: { source: string; collectionId?: string; field: string } } {
  return typeof v === "object" && v !== null && typeof (v as { $bind?: unknown }).$bind === "object";
}

function fieldLabel(field: FieldSchema, simpleMode: boolean): string {
  return (simpleMode && field.friendlyLabel) || field.label;
}

function FieldInput({
  field,
  value,
  onChange,
  onOpenMediaPicker,
  collections,
  customFonts,
  readOnly = false,
}: {
  field: FieldSchema;
  value: string;
  onChange: (v: string) => void;
  onOpenMediaPicker: () => void;
  collections: CollectionSummary[];
  customFonts: CustomFont[];
  readOnly?: boolean;
}) {
  if (field.input === "collectionSelect") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={readOnly} className="chrome-input w-full text-sm">
        <option value="">Select a collection...</option>
        {collections.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    );
  }
  if (field.input === "select") {
    // The shared FONT_FIELD (registry.tsx) has one fixed, static option
    // list at block-registration time — a site's uploaded fonts
    // (docs/reference-sites-plan.md Tier 4) are per-site data, so they're
    // merged in here at render time instead, keyed off the field's known
    // key rather than a new FieldSchema input type just for this one case.
    const isFontField = field.key === "fontFamily";
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={readOnly} className="chrome-input w-full text-sm">
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {isFontField && customFonts.length > 0 && (
          <optgroup label="Custom fonts">
            {customFonts.map((font) => (
              <option key={font.id} value={customFontFieldValue(font.id)}>
                {font.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    );
  }
  if (field.input === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        rows={3}
        className="chrome-input w-full text-sm"
      />
    );
  }
  if (field.input === "color") {
    return (
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)]"
      />
    );
  }
  if (field.input === "image") {
    return (
      <div className="flex flex-col gap-2">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-24 w-full rounded-[var(--radius-sm)] border border-[var(--border)] object-cover" />
        )}
        <div className="flex gap-2">
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} disabled={readOnly} className="chrome-input w-full text-sm" />
          <button onClick={onOpenMediaPicker} disabled={readOnly} className="chrome-btn chrome-btn-secondary shrink-0 !px-2 !py-1 text-xs">
            Choose
          </button>
        </div>
      </div>
    );
  }
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} disabled={readOnly} className="chrome-input w-full text-sm" />
  );
}

// Shown when a bindable field's literal input is toggled to a `$bind`
// reference (docs/collections.md's editor UX: "a toggle, not a separate
// mode"). `currentItem` (used when this page is itself bound to a
// Collection, i.e. it's the per-item template) only needs a field key;
// `collection` also needs which Collection to pull from.
function BindEditor({
  boundRef,
  collections,
  pageCollectionId,
  onChange,
  readOnly = false,
}: {
  boundRef: { source: string; collectionId?: string; field: string };
  collections: CollectionSummary[];
  pageCollectionId?: string | null;
  onChange: (next: { source: string; collectionId?: string; field: string }) => void;
  readOnly?: boolean;
}) {
  const isCurrentItem = boundRef.source === "currentItem";
  const targetCollection = isCurrentItem
    ? collections.find((c) => c.id === pageCollectionId)
    : collections.find((c) => c.id === boundRef.collectionId);

  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius-sm)] border border-dashed border-[var(--accent)] bg-[var(--accent-soft)] p-2">
      {!isCurrentItem && (
        <select
          value={boundRef.collectionId ?? ""}
          onChange={(e) => onChange({ ...boundRef, collectionId: e.target.value })}
          disabled={readOnly}
          className="chrome-input w-full !py-1 text-xs"
        >
          <option value="">Select a collection...</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      <select
        value={boundRef.field}
        onChange={(e) => onChange({ ...boundRef, field: e.target.value })}
        disabled={readOnly}
        className="chrome-input w-full !py-1 text-xs"
      >
        <option value="">Select a field...</option>
        {targetCollection?.fieldSchema.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label} ({f.key})
          </option>
        ))}
      </select>
    </div>
  );
}

export function Inspector({
  block,
  siteId,
  activeBreakpoint,
  theme,
  onChange,
  collections = [],
  customFonts = [],
  pageCollectionId = null,
  readOnly = false,
  simpleMode = false,
  activeLocale = null,
  translationEntity,
  translations = {},
  onTranslationChange,
  onTranslationClear,
}: InspectorProps) {
  const [mediaFieldKey, setMediaFieldKey] = useState<string | null>(null);
  // Struct edits (add/remove/reorder blocks) and non-translatable
  // props/style always go to the base tree regardless of selected locale
  // (docs/multilingual.md) — this only flips on for `translatable` prop
  // fields once a real non-default Locale is active and we know which
  // entity (Page/Template) owns this block tree.
  const translating = Boolean(activeLocale && !activeLocale.isDefault && translationEntity);

  if (!block) {
    return (
      <div className="p-4">
        <p className="text-sm text-[var(--text-muted)]">Select a block on the canvas to edit its properties.</p>
      </div>
    );
  }

  const def = getBlockDefinition(block.type);
  if (!def) return null;

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-[var(--text)]">{def.label}</h2>
      {activeBreakpoint !== "base" && (
        <p className="mt-1 text-xs text-amber-600">
          Editing style overrides for {activeBreakpoint}. Leave a field blank to inherit desktop.
        </p>
      )}
      {block.type === "form" && (
        <div className="mt-4">
          <FormFieldsEditor
            fields={Array.isArray(block.props.fields) ? (block.props.fields as FormField[]) : []}
            submitLabel={typeof block.props.submitLabel === "string" ? block.props.submitLabel : "Submit"}
            onSubmit={(block.props.onSubmit as FormOnSubmit | undefined) ?? { action: "storeOnly" }}
            collections={collections}
            onChange={(next) => {
              if (next.fields !== undefined) onChange("props", "fields", next.fields);
              if (next.submitLabel !== undefined) onChange("props", "submitLabel", next.submitLabel);
              if (next.onSubmit !== undefined) onChange("props", "onSubmit", next.onSubmit);
            }}
            readOnly={readOnly}
          />
        </div>
      )}
      {block.type === "accordion" && (
        <div className="mt-4">
          <AccordionItemsEditor
            items={Array.isArray(block.props.items) ? (block.props.items as AccordionItem[]) : []}
            onChange={(items) => onChange("props", "items", items)}
            readOnly={readOnly}
          />
        </div>
      )}
      {block.type === "pricingTable" && (
        <div className="mt-4">
          <PricingTiersEditor
            tiers={Array.isArray(block.props.tiers) ? (block.props.tiers as PricingTier[]) : []}
            onChange={(tiers) => onChange("props", "tiers", tiers)}
            readOnly={readOnly}
          />
        </div>
      )}
      {block.type === "contentSwitcher" && (
        <div className="mt-4">
          <ContentSwitcherItemsEditor
            items={Array.isArray(block.props.items) ? (block.props.items as ContentSwitcherItem[]) : []}
            onChange={(items) => onChange("props", "items", items)}
            readOnly={readOnly}
          />
        </div>
      )}
      {block.type === "comparisonTable" && (
        <div className="mt-4">
          <ComparisonTableEditor
            columns={Array.isArray(block.props.columns) ? (block.props.columns as ComparisonColumn[]) : []}
            rows={Array.isArray(block.props.rows) ? (block.props.rows as ComparisonRow[]) : []}
            onChange={(next) => {
              if (next.columns !== undefined) onChange("props", "columns", next.columns);
              if (next.rows !== undefined) onChange("props", "rows", next.rows);
            }}
            readOnly={readOnly}
          />
        </div>
      )}
      {(block.type === "gallery" || block.type === "slider") && (
        <div className="mt-4">
          <BlockImagesEditor
            images={Array.isArray(block.props.images) ? (block.props.images as BlockImage[]) : []}
            siteId={siteId}
            onChange={(images) => onChange("props", "images", images)}
            readOnly={readOnly}
          />
        </div>
      )}
      <div className="mt-4 flex flex-col gap-4">
        {block.type !== "form" && def.inspector.map((field) => {
          const isStyle = field.group === "style";
          // Props are global (not breakpoint-scoped); style edits write into
          // the currently active breakpoint's override bucket.
          const source = isStyle ? block.style?.[activeBreakpoint] ?? {} : block.props;
          const raw = source[field.key];
          const tokenRef = isTokenRef(raw) ? raw.$token : null;
          const boundRef = isBindRef(raw) ? raw.$bind : null;
          const value = typeof raw === "string" ? raw : "";
          const tokenOptions = field.tokenCategory && theme ? tokenOptionsFor(theme, field.tokenCategory) : [];
          const bindable = field.bindable && collections.length > 0;
          const label = fieldLabel(field, simpleMode);

          // docs/multilingual.md: a translatable prop field, under a
          // non-default Locale, reads/writes a Translation row instead of
          // the base Block.props — unless it's currently `$bind`-ed, in
          // which case its per-locale value comes from the bound
          // CollectionItem's own Translation row (lib/bind.ts) instead, so
          // it keeps the normal bind UI below rather than a second,
          // conflicting translation editor for the same field.
          const useTranslationMode = translating && !isStyle && field.translatable && !boundRef;
          if (useTranslationMode) {
            const key = translationKey({
              entityType: translationEntity!.type,
              entityId: translationEntity!.id,
              blockId: block.id,
              field: `props.${field.key}`,
            });
            const overrideValue = translations[key];
            const isTranslated = overrideValue !== undefined;
            const displayValue = overrideValue ?? value;
            return (
              <div key={`${field.group}.${field.key}`}>
                <div className="mb-1 flex items-center justify-between">
                  <label className="chrome-label !mb-0">{label}</label>
                  {isTranslated ? (
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => onTranslationClear?.(block.id, `props.${field.key}`)}
                      className="text-xs text-[var(--text-faint)] underline disabled:opacity-50"
                    >
                      Reset to default
                    </button>
                  ) : (
                    <span className="text-xs text-amber-600">Untranslated — showing default</span>
                  )}
                </div>
                <FieldInput
                  field={field}
                  value={displayValue}
                  onChange={(v) => onTranslationChange?.(block.id, `props.${field.key}`, v)}
                  onOpenMediaPicker={() => setMediaFieldKey(field.key)}
                  collections={collections}
                  customFonts={customFonts}
                  readOnly={readOnly}
                />
              </div>
            );
          }

          return (
            <div key={`${field.group}.${field.key}`}>
              <div className="mb-1 flex items-center justify-between">
                <label className="chrome-label !mb-0">{label}</label>
                {bindable && !translating && (
                  <label className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      checked={Boolean(boundRef)}
                      disabled={readOnly}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          onChange(field.group, field.key, "");
                          return;
                        }
                        const useCurrentItem = Boolean(pageCollectionId);
                        onChange(
                          field.group,
                          field.key,
                          useCurrentItem
                            ? { $bind: { source: "currentItem", field: "" } }
                            : { $bind: { source: "collection", collectionId: collections[0]?.id ?? "", field: "" } },
                        );
                      }}
                    />
                    {simpleMode ? "Use dynamic data" : "Bind"}
                  </label>
                )}
              </div>
              {boundRef && (
                <BindEditor
                  boundRef={boundRef}
                  collections={collections}
                  pageCollectionId={pageCollectionId}
                  onChange={(next) => onChange(field.group, field.key, { $bind: next })}
                  readOnly={readOnly}
                />
              )}
              {!boundRef && tokenOptions.length > 0 && (
                <select
                  value={tokenRef ?? "__custom__"}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") onChange(field.group, field.key, value);
                    else onChange(field.group, field.key, { $token: e.target.value });
                  }}
                  disabled={readOnly}
                  className="chrome-input mb-1 w-full !py-1 text-xs"
                >
                  <option value="__custom__">Custom value</option>
                  {tokenOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Theme: {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {!tokenRef && !boundRef && (
                <FieldInput
                  field={field}
                  value={value}
                  onChange={(v) => onChange(field.group, field.key, v)}
                  onOpenMediaPicker={() => setMediaFieldKey(field.key)}
                  collections={collections}
                  customFonts={customFonts}
                  readOnly={readOnly}
                />
              )}
            </div>
          );
        })}
      </div>
      {mediaFieldKey && (
        <MediaPicker
          siteId={siteId}
          onClose={() => setMediaFieldKey(null)}
          onSelect={(url) => {
            onChange("props", mediaFieldKey, url);
            setMediaFieldKey(null);
          }}
        />
      )}
    </div>
  );
}
