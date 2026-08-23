import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/permissions";
import { actorHasScope, getRequestActor } from "@/lib/apiAuth";
import type { Prisma } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string; pageId: string }> }) {
  const { siteId, pageId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "publish")) return NextResponse.json({ error: "This API key's scopes don't allow publishing." }, { status: 403 });

  const page = await requirePageRole(pageId, actor.userId, ["OWNER"]);
  if (!page || page.siteId !== siteId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await db.$transaction([
    db.page.update({
      where: { id: pageId },
      data: { publishedContent: page.draftContent as Prisma.InputJsonValue },
    }),
    db.revision.create({
      data: {
        pageId,
        content: page.draftContent as Prisma.InputJsonValue,
        createdById: actor.userId,
      },
    }),
  ]);
  return NextResponse.json(updated);
}
