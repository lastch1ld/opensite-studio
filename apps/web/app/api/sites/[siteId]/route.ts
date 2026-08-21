import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/permissions";

export async function DELETE(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteOwner(siteId, session.user.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.site.delete({ where: { id: siteId } });
  return NextResponse.json({ ok: true });
}
