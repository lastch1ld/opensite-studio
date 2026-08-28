import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { siteTemplateOptionById } from "@/lib/siteTemplateOptions";
import { siteTemplatePageContent } from "@/lib/siteTemplates";
import { completeAnthropic } from "@/lib/ai/anthropic";
import { decryptSecret } from "@/lib/secrets";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  GENERATION_SYSTEM_PROMPT,
  applyTextSlots,
  buildGenerationPrompt,
  collectTextSlots,
  parseGeneratedCopy,
} from "@/lib/aiGenerate";
import type { AiChatSettings } from "@/lib/siteSettings";
import type { Prisma } from "@prisma/client";

const GENERATION_MODEL = "claude-sonnet-5";
const MAX_DESCRIPTION_CHARS = 2000;

// "Describe your business, get a site": creates every page of a genre
// template (the same batch the /site-templates route creates) and fills
// its placeholder copy with generated text. See lib/aiGenerate.ts for why
// the model writes copy rather than block trees.
export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Each generation is several model calls against somebody's paid key.
  if (!checkRateLimit(`generate:${session.user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many generations — wait a minute and try again." }, { status: 429 });
  }

  const { templateId, description } = await req.json();
  const template = typeof templateId === "string" ? siteTemplateOptionById(templateId) : undefined;
  if (!template) return NextResponse.json({ error: "Unknown site template" }, { status: 400 });
  if (typeof description !== "string" || description.trim().length < 20) {
    return NextResponse.json(
      { error: "Describe the business in a sentence or two so there's something to write from." },
      { status: 400 },
    );
  }
  if (description.length > MAX_DESCRIPTION_CHARS) {
    return NextResponse.json({ error: "That description is too long." }, { status: 400 });
  }

  const apiKey = await resolveApiKey(siteId);
  if (!apiKey) {
    return NextResponse.json(
      { error: "No AI provider key configured. Set one in this site's AI settings, or ANTHROPIC_API_KEY on the server." },
      { status: 400 },
    );
  }

  const existingSlugs = new Set((await db.page.findMany({ where: { siteId }, select: { slug: true } })).map((p) => p.slug));
  const toCreate = template.pages.filter((p) => !existingSlugs.has(p.slug));
  const skipped = template.pages.filter((p) => existingSlugs.has(p.slug)).map((p) => p.slug || "(home)");
  if (toCreate.length === 0) {
    return NextResponse.json({ error: "Every page in this template already exists on the site.", skipped }, { status: 409 });
  }

  // One call per page rather than one for the whole site: each page's copy
  // then fits comfortably in a reply, and a page whose generation fails
  // still gets created with its placeholder copy intact.
  const generated = await Promise.all(
    toCreate.map(async (page) => {
      const content = siteTemplatePageContent(template.id, page.slug);
      if (!content) return { page, content: null, filled: 0 };

      const slots = collectTextSlots(content, page.slug);
      if (slots.length === 0) return { page, content, filled: 0 };

      try {
        const reply = await completeAnthropic({
          apiKey,
          model: GENERATION_MODEL,
          systemPrompt: GENERATION_SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildGenerationPrompt(description, slots) }],
        });
        const values = parseGeneratedCopy(reply, slots);
        return { page, content: applyTextSlots(content, page.slug, values), filled: Object.keys(values).length };
      } catch {
        // A template page with its placeholders is a usable starting point;
        // failing the whole request over one page's copy is not.
        return { page, content, filled: 0 };
      }
    }),
  );

  const created = await db.$transaction(async (tx) => {
    if (toCreate.some((p) => p.isHome)) {
      await tx.page.updateMany({ where: { siteId, isHome: true }, data: { isHome: false } });
    }
    const pages = [];
    for (const { page, content } of generated) {
      if (!content) continue;
      pages.push(
        await tx.page.create({
          data: {
            siteId,
            title: page.title,
            slug: page.slug,
            isHome: page.isHome,
            draftContent: content as unknown as Prisma.InputJsonValue,
          },
        }),
      );
    }
    return pages;
  });

  return NextResponse.json(
    {
      created,
      skipped,
      // Surfaced so the UI can say "3 of 4 pages got generated copy" rather
      // than silently handing back a half-templated site.
      copyFilled: generated.map((g) => ({ slug: g.page.slug, filled: g.filled })),
    },
    { status: 201 },
  );
}

/** The site's own configured provider key, else the server-wide one. */
async function resolveApiKey(siteId: string): Promise<string | null> {
  const settings = await db.siteSettings.findUnique({ where: { siteId } });
  const aiChat = settings?.aiChat as unknown as AiChatSettings | null;
  if (aiChat?.apiKeyEncrypted) {
    try {
      return decryptSecret(aiChat.apiKeyEncrypted);
    } catch {
      // A key that won't decrypt (rotated SECRETS_ENCRYPTION_KEY) shouldn't
      // block generation if the server has its own.
    }
  }
  return process.env.ANTHROPIC_API_KEY || null;
}
