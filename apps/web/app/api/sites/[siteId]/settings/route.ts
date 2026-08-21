import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import {
  defaultCookieBannerSettings,
  defaultNewsletterSettings,
  defaultAiCrawlerSettings,
  defaultChatbotEmbedSettings,
} from "@/lib/siteSettings";
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
    aiCrawlers: settings?.aiCrawlers ?? defaultAiCrawlerSettings(),
    chatbotEmbed: settings?.chatbotEmbed ?? defaultChatbotEmbedSettings(),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { cookieBanner, newsletter, aiCrawlers, chatbotEmbed } = await req.json();
  if (cookieBanner === undefined && newsletter === undefined && aiCrawlers === undefined && chatbotEmbed === undefined) {
    return NextResponse.json({ error: "cookieBanner, newsletter, aiCrawlers or chatbotEmbed is required" }, { status: 400 });
  }

  const settings = await db.siteSettings.upsert({
    where: { siteId },
    create: {
      siteId,
      cookieBanner: (cookieBanner ?? defaultCookieBannerSettings()) as Prisma.InputJsonValue,
      newsletter: (newsletter ?? defaultNewsletterSettings()) as Prisma.InputJsonValue,
      aiCrawlers: (aiCrawlers ?? defaultAiCrawlerSettings()) as Prisma.InputJsonValue,
      chatbotEmbed: (chatbotEmbed ?? defaultChatbotEmbedSettings()) as Prisma.InputJsonValue,
    },
    update: {
      ...(cookieBanner !== undefined ? { cookieBanner: cookieBanner as Prisma.InputJsonValue } : {}),
      ...(newsletter !== undefined ? { newsletter: newsletter as Prisma.InputJsonValue } : {}),
      ...(aiCrawlers !== undefined ? { aiCrawlers: aiCrawlers as Prisma.InputJsonValue } : {}),
      ...(chatbotEmbed !== undefined ? { chatbotEmbed: chatbotEmbed as Prisma.InputJsonValue } : {}),
    },
  });
  return NextResponse.json(settings);
}
