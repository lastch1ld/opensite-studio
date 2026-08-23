import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { saveMediaFile } from "@/lib/media";
import { customFontFormat, defaultCustomFonts, isFontFilename, type CustomFont } from "@/lib/siteSettings";
import type { Prisma } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = await db.siteSettings.findUnique({ where: { siteId } });
  return NextResponse.json((settings?.customFonts as unknown as CustomFont[] | null) ?? defaultCustomFonts());
}

// Uploads a WOFF/WOFF2/TTF/OTF file (docs/reference-sites-plan.md Tier 4)
// and registers it as a selectable font in one step — reuses the same
// underlying Media storage as image uploads (lib/media.ts's saveMediaFile,
// app/api/sites/[siteId]/media/route.ts's POST accepts any mimeType
// already, no server-side change needed there), then appends a CustomFont
// entry to SiteSettings.customFonts pointing at it.
export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  const name = formData.get("name");
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!isFontFilename(file.name)) {
    return NextResponse.json({ error: "File must be a .woff2, .woff, .ttf, or .otf font file" }, { status: 400 });
  }

  const { storageKey, url } = await saveMediaFile(siteId, file);
  const media = await db.media.create({
    data: { siteId, url, storageKey, mimeType: file.type || "application/octet-stream", altText: null },
  });

  const existing = await db.siteSettings.findUnique({ where: { siteId } });
  const currentFonts = (existing?.customFonts as unknown as CustomFont[] | null) ?? defaultCustomFonts();
  const newFont: CustomFont = {
    id: media.id,
    name: name.trim(),
    mediaId: media.id,
    url: media.url,
    format: customFontFormat(media.mimeType, file.name),
  };
  const nextFonts = [...currentFonts, newFont];

  await db.siteSettings.upsert({
    where: { siteId },
    create: { siteId, customFonts: nextFonts as unknown as Prisma.InputJsonValue },
    update: { customFonts: nextFonts as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json(newFont, { status: 201 });
}
