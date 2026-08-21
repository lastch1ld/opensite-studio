import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findBlock } from "@/lib/blockTree";
import { checkRateLimit } from "@/lib/rateLimit";
import { safePostJson } from "@/lib/safeFetch";
import { defaultNewsletterSettings, type NewsletterSettings } from "@/lib/siteSettings";
import type { PageContent } from "@/components/blocks/types";
import type { Prisma } from "@prisma/client";

// Public, unauthenticated endpoint — mirrors app/api/forms/submit/route.ts's
// shape (rate-limited, no permissions.ts role check since there's no
// membership involved for a site visitor).
export async function POST(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  // Last entry is the one the reverse proxy appended itself (trustworthy);
  // earlier entries are attacker-controlled if the proxy appends rather
  // than replaces the header.
  const ip = forwardedFor?.split(",").pop()?.trim() || "unknown";

  let body: { siteId?: unknown; pageId?: unknown; blockId?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { siteId, pageId, blockId, email } = body;
  if (
    typeof siteId !== "string" ||
    typeof pageId !== "string" ||
    typeof blockId !== "string" ||
    typeof email !== "string" ||
    !email.includes("@")
  ) {
    return NextResponse.json({ error: "siteId, pageId, blockId, and a valid email are required" }, { status: 400 });
  }

  if (!checkRateLimit(`${ip}:${siteId}`)) {
    return NextResponse.json({ error: "Too many submissions, try again later." }, { status: 429 });
  }

  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page || page.siteId !== siteId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content = page.publishedContent as unknown as PageContent | null;
  const block = content ? findBlock(content.root, blockId) : null;
  if (!block || block.type !== "newsletter") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Submissions are logged locally via FormSubmission (docs/integrations.md
  // "Submissions optionally also logged locally... as a fallback/backup even
  // when a provider is configured") — same "text data tied to a block on a
  // page" shape a form submission already has, no need for a parallel table.
  await db.formSubmission.create({
    data: { pageId, blockId, data: { email } as Prisma.InputJsonValue },
  });

  const settings = await db.siteSettings.findUnique({ where: { siteId } });
  const newsletter = (settings?.newsletter as unknown as NewsletterSettings | undefined) ?? defaultNewsletterSettings();

  if (newsletter.provider === "webhook" && newsletter.webhookUrl) {
    try {
      await safePostJson(newsletter.webhookUrl, { siteId, pageId, blockId, email });
    } catch {
      // Best-effort, same as the forms webhook dispatch: the submission is
      // already durably stored above, a failing/unreachable webhook
      // shouldn't fail the visitor's signup.
    }
  }

  return NextResponse.json({ ok: true });
}
