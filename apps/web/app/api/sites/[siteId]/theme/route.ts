import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/permissions";
import { DEFAULT_THEME_TOKENS } from "@/lib/theme";
import type { Prisma } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteOwner(siteId, session.user.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const theme = await db.theme.findUnique({ where: { siteId } });
  return NextResponse.json({ tokens: theme?.tokens ?? DEFAULT_THEME_TOKENS });
}

export async function PUT(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteOwner(siteId, session.user.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { tokens } = await req.json();
  if (!tokens || typeof tokens !== "object") {
    return NextResponse.json({ error: "tokens is required" }, { status: 400 });
  }

  const theme = await db.theme.upsert({
    where: { siteId },
    create: { siteId, tokens: tokens as Prisma.InputJsonValue },
    update: { tokens: tokens as Prisma.InputJsonValue },
  });
  return NextResponse.json(theme);
}
