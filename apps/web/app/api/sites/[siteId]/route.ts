import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole, requireSiteOwner } from "@/lib/permissions";

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

export async function DELETE(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteOwner(siteId, session.user.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.site.delete({ where: { id: siteId } });
  return NextResponse.json({ ok: true });
}
