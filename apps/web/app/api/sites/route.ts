import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SiteMode } from "@prisma/client";

const SITE_MODES: SiteMode[] = ["BUILDER", "AI_CHAT"];

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sites = await db.site.findMany({
    where: { OR: [{ ownerId: session.user.id }, { memberships: { some: { userId: session.user.id } } }] },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sites);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, subdomain, mode } = await req.json();
  if (typeof name !== "string" || !name.trim() || typeof subdomain !== "string" || !/^[a-z0-9-]+$/.test(subdomain)) {
    return NextResponse.json(
      { error: "Name is required and subdomain must be lowercase letters, numbers, and hyphens only." },
      { status: 400 },
    );
  }
  if (mode !== undefined && !SITE_MODES.includes(mode)) {
    return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
  }

  const existing = await db.site.findUnique({ where: { subdomain } });
  if (existing) return NextResponse.json({ error: "That subdomain is already taken." }, { status: 409 });

  const site = await db.site.create({
    data: {
      name,
      subdomain,
      mode: (mode as SiteMode | undefined) ?? "BUILDER",
      ownerId: session.user.id,
      memberships: { create: { userId: session.user.id, role: "OWNER" } },
    },
  });
  return NextResponse.json(site, { status: 201 });
}
