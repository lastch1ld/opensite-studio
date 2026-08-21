import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole, requireSiteOwner } from "@/lib/permissions";
import { generateVerificationToken, verificationRecordName } from "@/lib/domain";
import { Prisma } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    customDomain: site.customDomain,
    verified: site.customDomainVerified,
    verificationRecord: site.customDomain && site.customDomainVerifyToken
      ? { name: verificationRecordName(site.customDomain), type: "TXT", value: site.customDomainVerifyToken }
      : null,
  });
}

// Custom domains are as destructive as deleting the site (anyone who can set
// one can point traffic away from — or, once verified, effectively claim —
// a hostname), so this is OWNER-only like the other site-destructive routes
// (app/api/sites/[siteId]/route.ts DELETE), not the OWNER+EDITOR bar used by
// content settings like theme/settings.
export async function PUT(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteOwner(siteId, session.user.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { customDomain } = await req.json();
  if (customDomain !== null && typeof customDomain !== "string") {
    return NextResponse.json({ error: "customDomain must be a string or null" }, { status: 400 });
  }

  const normalized = customDomain ? customDomain.trim().toLowerCase() : null;
  if (normalized !== null && !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(normalized)) {
    return NextResponse.json({ error: "customDomain must be a valid hostname" }, { status: 400 });
  }

  try {
    const updated = await db.site.update({
      where: { id: siteId },
      data: normalized
        ? { customDomain: normalized, customDomainVerified: false, customDomainVerifyToken: generateVerificationToken() }
        : { customDomain: null, customDomainVerified: false, customDomainVerifyToken: null },
    });
    return NextResponse.json({
      customDomain: updated.customDomain,
      verified: updated.customDomainVerified,
      verificationRecord: updated.customDomain && updated.customDomainVerifyToken
        ? { name: verificationRecordName(updated.customDomain), type: "TXT", value: updated.customDomainVerifyToken }
        : null,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "This domain is already in use by another site" }, { status: 409 });
    }
    throw err;
  }
}
