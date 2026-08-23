import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/permissions";
import { actorHasScope, getRequestActor } from "@/lib/apiAuth";

export async function DELETE(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "write")) return NextResponse.json({ error: "This API key's scopes don't allow write access." }, { status: 403 });

  const site = await requireSiteOwner(siteId, actor.userId);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.site.delete({ where: { id: siteId } });
  return NextResponse.json({ ok: true });
}
