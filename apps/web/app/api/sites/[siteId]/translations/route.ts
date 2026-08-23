import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { translationKey, upsertTranslation, deleteTranslation, type TranslationEntityType } from "@/lib/translations";

const ENTITY_TYPES: TranslationEntityType[] = ["page", "template", "collectionItem"];

function isEntityType(v: unknown): v is TranslationEntityType {
  return typeof v === "string" && (ENTITY_TYPES as string[]).includes(v);
}

// docs/multilingual.md item 7: the editor persists what the user types
// under a given locale through this route, scoped through the same
// site-role permission checks as page/template content edits (AGENTS.md
// rule 4) — never a UI-only gate.
export async function GET(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const localeId = url.searchParams.get("localeId");
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  if (!localeId || !entityId || !isEntityType(entityType)) {
    return NextResponse.json({ error: "localeId, entityType and entityId are required" }, { status: 400 });
  }

  const rows = await db.translation.findMany({ where: { siteId, localeId, entityType, entityId } });
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[translationKey({ entityType: row.entityType, entityId: row.entityId, blockId: row.blockId, field: row.field })] =
      row.value;
  }
  return NextResponse.json(map);
}

export async function PUT(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { localeId, entityType, entityId, blockId, field, value } = await req.json();
  if (!localeId || !entityId || !field || !isEntityType(entityType) || typeof value !== "string") {
    return NextResponse.json(
      { error: "localeId, entityType, entityId, field and value (string) are required" },
      { status: 400 },
    );
  }
  if (blockId !== undefined && blockId !== null && typeof blockId !== "string") {
    return NextResponse.json({ error: "blockId must be a string or null" }, { status: 400 });
  }

  const locale = await db.locale.findUnique({ where: { id: localeId } });
  if (!locale || locale.siteId !== siteId) return NextResponse.json({ error: "Locale not found" }, { status: 404 });

  // Editing under the default locale would be a no-op that could confuse
  // "what's the base content" — the default locale's content always lives
  // directly on the base Block/entity, never in a Translation row.
  if (locale.isDefault) {
    return NextResponse.json({ error: "Cannot create a Translation override for the default locale" }, { status: 400 });
  }

  const row = await upsertTranslation({ siteId, localeId, entityType, entityId, blockId: blockId ?? null, field, value });
  return NextResponse.json(row);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { localeId, entityType, entityId, blockId, field } = await req.json();
  if (!localeId || !entityId || !field || !isEntityType(entityType)) {
    return NextResponse.json({ error: "localeId, entityType, entityId and field are required" }, { status: 400 });
  }

  const locale = await db.locale.findUnique({ where: { id: localeId } });
  if (!locale || locale.siteId !== siteId) return NextResponse.json({ error: "Locale not found" }, { status: 404 });

  await deleteTranslation({ localeId, entityType, entityId, blockId: blockId ?? null, field });
  return NextResponse.json({ ok: true });
}
