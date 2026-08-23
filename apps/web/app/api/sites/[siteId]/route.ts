import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireSiteRole, requireSiteOwner } from "@/lib/permissions";
import { actorHasScope, getRequestActor } from "@/lib/apiAuth";

// Currently only carries `defaultLocalePrefixed` (docs/multilingual.md
// "Routing" — whether the default Locale's URLs are also prefixed) since
// that's the one Site-level field the multilingual feature needs; extend
// this route's body rather than adding a parallel one if more Site-level
// settings show up later.
export async function PATCH(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { defaultLocalePrefixed } = await req.json();
  if (defaultLocalePrefixed === undefined) {
    return NextResponse.json({ error: "defaultLocalePrefixed is required" }, { status: 400 });
  }

  const updated = await db.site.update({ where: { id: siteId }, data: { defaultLocalePrefixed: Boolean(defaultLocalePrefixed) } });
  return NextResponse.json(updated);
}

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
