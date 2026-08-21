import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; revisionId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pageId, revisionId } = await params;
  const page = await requirePageRole(pageId, session.user.id, ["OWNER", "EDITOR"]);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const revision = await db.revision.findUnique({ where: { id: revisionId } });
  if (!revision || revision.pageId !== pageId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Restoring only loads the revision into the draft — it does not
  // auto-publish, matching the existing draft/publish separation.
  const updated = await db.page.update({
    where: { id: pageId },
    data: { draftContent: revision.content as Prisma.InputJsonValue },
  });
  return NextResponse.json(updated);
}
