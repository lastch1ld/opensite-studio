import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { defaultCookieBannerSettings, defaultNewsletterSettings } from "@/lib/siteSettings";
import type { Prisma } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = await db.siteSettings.findUnique({ where: { siteId } });
  return NextResponse.json({
    cookieBanner: settings?.cookieBanner ?? defaultCookieBannerSettings(),
    newsletter: settings?.newsletter ?? defaultNewsletterSettings(),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { cookieBanner, newsletter } = await req.json();
  if (cookieBanner === undefined && newsletter === undefined) {
    return NextResponse.json({ error: "cookieBanner or newsletter is required" }, { status: 400 });
  }

  const settings = await db.siteSettings.upsert({
    where: { siteId },
    create: {
      siteId,
      cookieBanner: (cookieBanner ?? defaultCookieBannerSettings()) as Prisma.InputJsonValue,
      newsletter: (newsletter ?? defaultNewsletterSettings()) as Prisma.InputJsonValue,
    },
    update: {
      ...(cookieBanner !== undefined ? { cookieBanner: cookieBanner as Prisma.InputJsonValue } : {}),
      ...(newsletter !== undefined ? { newsletter: newsletter as Prisma.InputJsonValue } : {}),
    },
  });
  return NextResponse.json(settings);
}
