import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { actorHasScope, getRequestActor } from "@/lib/apiAuth";

export async function GET(req: Request, { params }: { params: Promise<{ siteId: string; pageId: string }> }) {
  const { siteId, pageId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "read")) return NextResponse.json({ error: "This API key's scopes don't allow read access." }, { status: 403 });

  const site = await requireSiteRole(siteId, actor.userId, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page || page.siteId !== siteId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const submissions = await db.formSubmission.findMany({ where: { pageId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(submissions);
}
