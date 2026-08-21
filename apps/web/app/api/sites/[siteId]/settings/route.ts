import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import {
  defaultCookieBannerSettings,
  defaultNewsletterSettings,
  defaultAiCrawlerSettings,
  defaultChatbotEmbedSettings,
  defaultAiChatSettings,
  redactAiChatSettings,
  type AiChatSettings,
} from "@/lib/siteSettings";
import { encryptSecret } from "@/lib/secrets";
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
    aiChat: redactAiChatSettings((settings?.aiChat as unknown as AiChatSettings | null) ?? defaultAiChatSettings()),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { cookieBanner, newsletter, aiCrawlers, chatbotEmbed, aiChat } = await req.json();
  if (
    cookieBanner === undefined &&
    newsletter === undefined &&
    aiCrawlers === undefined &&
    chatbotEmbed === undefined &&
    aiChat === undefined
  ) {
    return NextResponse.json(
      { error: "cookieBanner, newsletter, aiCrawlers, chatbotEmbed or aiChat is required" },
      { status: 400 },
    );
  }

  let aiChatToStore: Prisma.InputJsonValue | undefined;
  if (aiChat !== undefined) {
    const existing = await db.siteSettings.findUnique({ where: { siteId } });
    const existingAiChat = (existing?.aiChat as unknown as AiChatSettings | null) ?? defaultAiChatSettings();
    const { apiKey, ...rest } = aiChat as Partial<AiChatSettings> & { apiKey?: string | null };
    const merged: AiChatSettings = { ...existingAiChat, ...rest };
    if (typeof apiKey === "string" && apiKey.trim()) {
      merged.apiKeyEncrypted = encryptSecret(apiKey.trim());
    } else if (apiKey === null) {
      delete merged.apiKeyEncrypted;
    }
    aiChatToStore = merged as unknown as Prisma.InputJsonValue;
  }

  const settings = await db.siteSettings.upsert({
    where: { siteId },
    create: {
      siteId,
      cookieBanner: (cookieBanner ?? defaultCookieBannerSettings()) as Prisma.InputJsonValue,
      newsletter: (newsletter ?? defaultNewsletterSettings()) as Prisma.InputJsonValue,
      aiCrawlers: (aiCrawlers ?? defaultAiCrawlerSettings()) as Prisma.InputJsonValue,
      chatbotEmbed: (chatbotEmbed ?? defaultChatbotEmbedSettings()) as Prisma.InputJsonValue,
      aiChat: (aiChatToStore ?? (defaultAiChatSettings() as unknown as Prisma.InputJsonValue)),
    },
    update: {
      ...(cookieBanner !== undefined ? { cookieBanner: cookieBanner as Prisma.InputJsonValue } : {}),
      ...(newsletter !== undefined ? { newsletter: newsletter as Prisma.InputJsonValue } : {}),
      ...(aiCrawlers !== undefined ? { aiCrawlers: aiCrawlers as Prisma.InputJsonValue } : {}),
      ...(chatbotEmbed !== undefined ? { chatbotEmbed: chatbotEmbed as Prisma.InputJsonValue } : {}),
      ...(aiChatToStore !== undefined ? { aiChat: aiChatToStore } : {}),
    },
  });
  return NextResponse.json({
    ...settings,
    aiChat: redactAiChatSettings((settings.aiChat as unknown as AiChatSettings | null) ?? defaultAiChatSettings()),
  });
}
