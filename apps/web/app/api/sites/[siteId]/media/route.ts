import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/permissions";
import { saveMediaFile } from "@/lib/media";

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteOwner(siteId, session.user.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const media = await db.media.findMany({ where: { siteId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(media);
}

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteOwner(siteId, session.user.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });

  const { storageKey, url } = await saveMediaFile(siteId, file);
  const media = await db.media.create({
    data: {
      siteId,
      url,
      storageKey,
      mimeType: file.type || "application/octet-stream",
      altText: null,
    },
  });
  return NextResponse.json(media, { status: 201 });
}
