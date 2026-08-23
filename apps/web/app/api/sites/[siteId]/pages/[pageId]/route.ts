import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/permissions";
import { actorHasScope, getRequestActor } from "@/lib/apiAuth";
import type { Prisma } from "@prisma/client";

// Not used by the editor UI (it SSR-reads the page directly), but part of
// the public API contract's page CRUD (docs/api.md) — CLI `pages get` and
// the MCP server's page tools need a single-page read.
export async function GET(req: Request, { params }: { params: Promise<{ siteId: string; pageId: string }> }) {
  const { siteId, pageId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "read")) return NextResponse.json({ error: "This API key's scopes don't allow read access." }, { status: 403 });

  const page = await requirePageRole(pageId, actor.userId, ["OWNER", "EDITOR", "VIEWER"]);
  if (!page || page.siteId !== siteId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(page);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ siteId: string; pageId: string }> }) {
  const { siteId, pageId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "write")) return NextResponse.json({ error: "This API key's scopes don't allow write access." }, { status: 403 });

  const page = await requirePageRole(pageId, actor.userId, ["OWNER", "EDITOR"]);
  if (!page || page.siteId !== siteId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { draftContent, collectionId, seo, isHome } = await req.json();
  if (draftContent === undefined && collectionId === undefined && seo === undefined && isHome === undefined) {
    return NextResponse.json({ error: "draftContent, collectionId, seo, or isHome is required" }, { status: 400 });
  }

  const data: Prisma.PageUpdateInput = {};
  if (draftContent !== undefined) data.draftContent = draftContent as Prisma.InputJsonValue;
  if (collectionId !== undefined) {
    data.collection = collectionId ? { connect: { id: collectionId as string } } : { disconnect: true };
  }
  if (seo !== undefined) data.seo = seo as Prisma.InputJsonValue;
  if (isHome !== undefined) data.isHome = Boolean(isHome);

  const updated = await db.$transaction(async (tx) => {
    if (isHome) {
      await tx.page.updateMany({ where: { siteId: page.siteId, isHome: true, NOT: { id: pageId } }, data: { isHome: false } });
    }
    return tx.page.update({ where: { id: pageId }, data });
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ siteId: string; pageId: string }> }) {
  const { siteId, pageId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "write")) return NextResponse.json({ error: "This API key's scopes don't allow write access." }, { status: 403 });

  const page = await requirePageRole(pageId, actor.userId, ["OWNER", "EDITOR"]);
  if (!page || page.siteId !== siteId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.page.delete({ where: { id: pageId } });
  return NextResponse.json({ ok: true });
}
