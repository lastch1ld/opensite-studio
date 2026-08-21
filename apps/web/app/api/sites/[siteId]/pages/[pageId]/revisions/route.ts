import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pageId } = await params;
  const page = await requirePageRole(pageId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const revisions = await db.revision.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(
    revisions.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      label: r.label,
      createdBy: r.createdBy,
    })),
  );
}
