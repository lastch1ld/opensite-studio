import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findBlock } from "@/lib/blockTree";
import { saveMediaFile } from "@/lib/media";
import { checkRateLimit } from "@/lib/rateLimit";
import type { PageContent, FormBlockProps } from "@/components/blocks/types";
import type { Prisma } from "@prisma/client";

// Public, unauthenticated endpoint — site visitors submit forms, not CMS
// users, so this intentionally lives outside app/api/sites/** and doesn't
// go through lib/permissions.ts (there's no membership role to check here).
// Abuse surface is instead bounded by per-IP/site rate limiting, per
// docs/forms.md.
export async function POST(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  // Last entry is the one the reverse proxy appended itself (trustworthy);
  // earlier entries are attacker-controlled if the proxy appends rather
  // than replaces the header.
  const ip = forwardedFor?.split(",").pop()?.trim() || "unknown";

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission" }, { status: 400 });
  }

  const metaRaw = formData.get("meta");
  const dataRaw = formData.get("data");
  if (typeof metaRaw !== "string" || typeof dataRaw !== "string") {
    return NextResponse.json({ error: "Missing meta/data" }, { status: 400 });
  }

  let meta: { siteId?: unknown; pageId?: unknown; blockId?: unknown };
  let data: Record<string, unknown>;
  try {
    meta = JSON.parse(metaRaw);
    data = JSON.parse(dataRaw);
  } catch {
    return NextResponse.json({ error: "Invalid meta/data" }, { status: 400 });
  }

  const { siteId, pageId, blockId } = meta;
  if (typeof siteId !== "string" || typeof pageId !== "string" || typeof blockId !== "string") {
    return NextResponse.json({ error: "siteId, pageId, and blockId are required" }, { status: 400 });
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
  if (!block || block.type !== "form") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formProps = block.props as unknown as FormBlockProps;

  // File fields arrive as separate multipart entries (`file:<fieldId>`),
  // stored via the same media pipeline as site media (lib/media.ts) but
  // without a Media row — kept off the site's general media library, per
  // docs/forms.md, since these are submitter-provided files, not
  // site-authored assets.
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("file:") || !(value instanceof File)) continue;
    const fieldId = key.slice("file:".length);
    const { url } = await saveMediaFile(siteId, value);
    data[fieldId] = url;
  }

  for (const field of formProps.fields ?? []) {
    if (field.required && (data[field.id] === undefined || data[field.id] === "" || data[field.id] === null)) {
      return NextResponse.json({ error: `${field.label} is required` }, { status: 400 });
    }
  }

  await db.formSubmission.create({
    data: { pageId, blockId, data: data as Prisma.InputJsonValue },
  });

  const onSubmit = formProps.onSubmit;
  if (onSubmit?.action === "webhook" && onSubmit.url) {
    try {
      await fetch(onSubmit.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, blockId, data }),
      });
    } catch {
      // Best-effort: the submission itself is already durably stored above,
      // a failing/unreachable webhook shouldn't fail the visitor's submit.
    }
  } else if (onSubmit?.action === "email") {
    // No SMTP wired up yet (docs/deployment.md), same simplification as the
    // Membership invite flow (components/dashboard/MembersPanel.tsx) — log
    // instead of sending.
    console.log(`[forms] would email ${onSubmit.to} about submission on page ${pageId}, block ${blockId}`);
  }

  return NextResponse.json({ ok: true });
}
