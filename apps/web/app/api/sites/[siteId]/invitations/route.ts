import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import type { MembershipRole } from "@prisma/client";

const INVITABLE_ROLES: MembershipRole[] = ["EDITOR", "VIEWER"];

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invitations = await db.invitation.findMany({ where: { siteId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(invitations);
}

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { email, role } = await req.json();
  if (typeof email !== "string" || !email.trim() || !INVITABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "A valid email and role (EDITOR or VIEWER) are required." }, { status: 400 });
  }

  const invitation = await db.invitation.create({
    data: { siteId, email: email.trim(), role, token: randomUUID() },
  });
  return NextResponse.json(invitation, { status: 201 });
}
