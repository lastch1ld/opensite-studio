import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";

// Revoke, not delete: keeps the row (and its lastUsedAt/audit trail) around
// with revokedAt set, same "soft" pattern as Invitation.acceptedAt rather
// than losing history on a hard delete.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ siteId: string; keyId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, keyId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const apiKey = await db.apiKey.findUnique({ where: { id: keyId } });
  if (!apiKey || apiKey.siteId !== siteId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
    select: { id: true, revokedAt: true },
  });
  return NextResponse.json(updated);
}
