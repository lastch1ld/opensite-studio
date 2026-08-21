import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/permissions";
import { verifyDomainTxtRecord } from "@/lib/domain";

export async function POST(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteOwner(siteId, session.user.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!site.customDomain || !site.customDomainVerifyToken) {
    return NextResponse.json({ error: "No custom domain is set for this site" }, { status: 400 });
  }

  const verified = await verifyDomainTxtRecord(site.customDomain, site.customDomainVerifyToken);
  if (verified) {
    await db.site.update({ where: { id: siteId }, data: { customDomainVerified: true } });
  }
  return NextResponse.json({ verified });
}
