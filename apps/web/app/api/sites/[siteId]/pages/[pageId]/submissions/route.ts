import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string; pageId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, pageId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page || page.siteId !== siteId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const submissions = await db.formSubmission.findMany({ where: { pageId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(submissions);
}
