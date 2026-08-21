import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requirePageOwner } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

export async function POST(_req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pageId } = await params;
  const page = await requirePageOwner(pageId, session.user.id);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.page.update({
    where: { id: pageId },
    data: { publishedContent: page.draftContent as Prisma.InputJsonValue },
  });
  return NextResponse.json(updated);
}
