import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { emptyPageContent } from "@/lib/pageContent";
import type { Prisma } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pages = await db.page.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(pages);
}

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, slug, isHome } = await req.json();
  if (typeof title !== "string" || !title.trim() || typeof slug !== "string" || !/^[a-z0-9-]*$/.test(slug)) {
    return NextResponse.json(
      { error: "Title is required and slug must be lowercase letters, numbers, and hyphens only." },
      { status: 400 },
    );
  }

  const existing = await db.page.findUnique({ where: { siteId_slug: { siteId, slug } } });
  if (existing) return NextResponse.json({ error: "A page with that slug already exists." }, { status: 409 });

  const page = await db.page.create({
    data: {
      siteId,
      title,
      slug,
      isHome: Boolean(isHome),
      draftContent: emptyPageContent() as unknown as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json(page, { status: 201 });
}
