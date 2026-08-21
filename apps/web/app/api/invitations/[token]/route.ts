import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await db.invitation.findUnique({ where: { token }, include: { site: true } });
  if (!invitation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    email: invitation.email,
    role: invitation.role,
    acceptedAt: invitation.acceptedAt,
    siteName: invitation.site.name,
  });
}

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await params;
  const invitation = await db.invitation.findUnique({ where: { token } });
  if (!invitation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invitation.acceptedAt) return NextResponse.json({ error: "Invitation already accepted." }, { status: 409 });
  if (invitation.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return NextResponse.json({ error: "This invitation was sent to a different email address." }, { status: 403 });
  }

  const [, membership] = await db.$transaction([
    db.invitation.update({ where: { token }, data: { acceptedAt: new Date() } }),
    db.membership.upsert({
      where: { siteId_userId: { siteId: invitation.siteId, userId: session.user.id } },
      create: { siteId: invitation.siteId, userId: session.user.id, role: invitation.role },
      update: { role: invitation.role },
    }),
  ]);
  return NextResponse.json({ siteId: membership.siteId });
}
