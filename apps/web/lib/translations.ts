import { db } from "./db";
import type { FieldSchema } from "@/components/blocks/types";

export type TranslationEntityType = "page" | "template" | "collectionItem";

// Flat lookup key for one Translation row. Deliberately a plain string map
// (not a nested object) so a whole site/locale's overrides can be bulk
// loaded once per render (mirrors how collectionItems are bulk loaded in
// lib/resolveSite.ts) and threaded through RenderContext without every call
// site needing its own DB round trip.
export function translationKey(params: {
  entityType: TranslationEntityType;
  entityId: string;
  blockId?: string | null;
  field: string;
}): string {
  return `${params.entityType}:${params.entityId}:${params.blockId ?? ""}:${params.field}`;
}

// Resolves one field's value against a locale's Translation overrides: no
// override for the active locale falls back to `baseValue` untouched. This
// is the one shared resolve function for the whole multilingual feature —
// mirrors resolveTokens ($token, lib/responsiveStyle.ts) and resolveBind
// ($bind, lib/bind.ts) — called from both BlockRenderer (public renderer +
// editor canvas preview) and the Inspector's field read/write. Never fork
// into a locale-aware and a locale-unaware version of resolution (see
// docs/multilingual.md, AGENTS.md rule 3).
export function resolveTranslatedValue(
  translations: Record<string, string> | undefined,
  params: { entityType: TranslationEntityType; entityId: string; blockId?: string | null; field: string },
  baseValue: string,
): { value: string; translated: boolean } {
  if (!translations) return { value: baseValue, translated: false };
  const override = translations[translationKey(params)];
  if (override === undefined) return { value: baseValue, translated: false };
  return { value: override, translated: true };
}

// Applies translation overrides to a block's already-$token/$bind-resolved
// props, for whichever of the block type's fields are marked
// `translatable` (components/blocks/types.ts's FieldSchema) — text content,
// image alt text, button labels, etc. Called from BlockRenderer only; skips
// entirely when no locale/translations are active so the public renderer's
// default-locale render path (and every editor context that hasn't touched
// the locale switcher) is unaffected.
//
// `rawProps` (the block's own, pre-resolution props) gates a field out when
// its raw value is a `{ $bind }`/`{ $token }` reference rather than a plain
// literal: a bindable+translatable field (e.g. `text.content`) sourced from
// a CollectionItem is translated via that item's own Translation row
// (lib/bind.ts's resolveBind), not a second page/template-level row for the
// same field — one field, one translation source, never both.
export function resolveTranslatedProps(
  rawProps: Record<string, unknown>,
  resolvedProps: Record<string, unknown>,
  fields: FieldSchema[],
  translations: Record<string, string> | undefined,
  entity: { type: "page" | "template"; id: string } | undefined,
  blockId: string,
): Record<string, unknown> {
  if (!translations || !entity) return resolvedProps;
  let out: Record<string, unknown> | null = null;
  for (const field of fields) {
    if (field.group !== "props" || !field.translatable) continue;
    if (typeof rawProps[field.key] !== "string") continue;
    const raw = resolvedProps[field.key];
    if (typeof raw !== "string") continue;
    const { value, translated } = resolveTranslatedValue(
      translations,
      { entityType: entity.type, entityId: entity.id, blockId, field: `props.${field.key}` },
      raw,
    );
    if (!translated) continue;
    if (!out) out = { ...resolvedProps };
    out[field.key] = value;
  }
  return out ?? resolvedProps;
}

// Bulk-loads every Translation row for a site+locale into the flat map
// shape `resolveTranslatedValue`/`resolveTranslatedProps` expect. Used by
// the public renderer (lib/resolveSite.ts) and the editor (the translations
// API route) — the one place either side reads Translation rows from the
// DB, so both go through the same shape.
export async function loadTranslationsMap(siteId: string, localeId: string): Promise<Record<string, string>> {
  const rows = await db.translation.findMany({ where: { siteId, localeId } });
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[translationKey({ entityType: row.entityType, entityId: row.entityId, blockId: row.blockId, field: row.field })] =
      row.value;
  }
  return map;
}

// Upserts one Translation row. Manual find-then-write rather than Prisma's
// native `upsert` — see schema.prisma's comment on Translation's unique
// index for why (Postgres doesn't collide on NULL `blockId`).
export async function upsertTranslation(params: {
  siteId: string;
  localeId: string;
  entityType: TranslationEntityType;
  entityId: string;
  blockId?: string | null;
  field: string;
  value: string;
}) {
  const blockId = params.blockId ?? null;
  const existing = await db.translation.findFirst({
    where: {
      localeId: params.localeId,
      entityType: params.entityType,
      entityId: params.entityId,
      blockId,
      field: params.field,
    },
  });
  if (existing) {
    return db.translation.update({ where: { id: existing.id }, data: { value: params.value } });
  }
  return db.translation.create({
    data: {
      siteId: params.siteId,
      localeId: params.localeId,
      entityType: params.entityType,
      entityId: params.entityId,
      blockId,
      field: params.field,
      value: params.value,
    },
  });
}

// Deletes one Translation row (an editor "clear override, revert to
// default" action), if it exists. Same find-then-delete reasoning as
// upsertTranslation.
export async function deleteTranslation(params: {
  localeId: string;
  entityType: TranslationEntityType;
  entityId: string;
  blockId?: string | null;
  field: string;
}) {
  const blockId = params.blockId ?? null;
  const existing = await db.translation.findFirst({
    where: {
      localeId: params.localeId,
      entityType: params.entityType,
      entityId: params.entityId,
      blockId,
      field: params.field,
    },
  });
  if (existing) await db.translation.delete({ where: { id: existing.id } });
}
