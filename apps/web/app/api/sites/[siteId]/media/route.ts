import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { saveMediaFile, validateUpload } from "@/lib/media";
import { actorHasScope, getRequestActor } from "@/lib/apiAuth";

export async function GET(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "read")) return NextResponse.json({ error: "This API key's scopes don't allow read access." }, { status: 403 });

  const site = await requireSiteRole(siteId, actor.userId, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const media = await db.media.findMany({ where: { siteId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(media);
}

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });

  const invalid = validateUpload(file);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  // `mimeType` comes back from saveMediaFile, not from the upload: a raster
  // image is stored re-encoded as WebP, and the serve route sets
  // Content-Type from this row.
  const { storageKey, url, mimeType } = await saveMediaFile(siteId, file);
  const media = await db.media.create({
    data: {
      siteId,
      url,
      storageKey,
      mimeType,
      altText: null,
    },
  });
  return NextResponse.json(media, { status: 201 });
}
