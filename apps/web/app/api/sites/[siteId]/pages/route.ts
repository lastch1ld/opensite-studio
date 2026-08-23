import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { pageContentForTemplate } from "@/lib/pageTemplates";
import { actorHasScope, getRequestActor } from "@/lib/apiAuth";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "read")) return NextResponse.json({ error: "This API key's scopes don't allow read access." }, { status: 403 });

  const site = await requireSiteRole(siteId, actor.userId, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pages = await db.page.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(pages);
}

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "write")) return NextResponse.json({ error: "This API key's scopes don't allow write access." }, { status: 403 });

  const site = await requireSiteRole(siteId, actor.userId, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, slug, isHome, template } = await req.json();
  if (typeof title !== "string" || !title.trim() || typeof slug !== "string" || !/^[a-z0-9-]*$/.test(slug)) {
    return NextResponse.json(
      { error: "Title is required and slug must be lowercase letters, numbers, and hyphens only." },
      { status: 400 },
    );
  }

  const existing = await db.page.findUnique({ where: { siteId_slug: { siteId, slug } } });
  if (existing) return NextResponse.json({ error: "A page with that slug already exists." }, { status: 409 });

  const page = await db.$transaction(async (tx) => {
    if (isHome) await tx.page.updateMany({ where: { siteId, isHome: true }, data: { isHome: false } });
    return tx.page.create({
      data: {
        siteId,
        title,
        slug,
        isHome: Boolean(isHome),
        draftContent: pageContentForTemplate(typeof template === "string" ? template : "blank") as unknown as Prisma.InputJsonValue,
      },
    });
  });
  return NextResponse.json(page, { status: 201 });
}
