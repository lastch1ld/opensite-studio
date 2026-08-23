import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { siteTemplateOptionById } from "@/lib/siteTemplateOptions";
import { siteTemplatePageContent } from "@/lib/siteTemplates";
import type { Prisma } from "@prisma/client";

// Creates every page a full site template defines in one request
// (docs/reference-sites-plan.md's genre templates — "one cohesive site",
// not five separate manual "Create page" actions). Skips any page whose
// slug already exists on this site rather than failing the whole batch —
// reports which were skipped so a re-run (e.g. after deleting one page) is
// safe and idempotent.
export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { templateId } = await req.json();
  const template = typeof templateId === "string" ? siteTemplateOptionById(templateId) : undefined;
  if (!template) return NextResponse.json({ error: "Unknown site template" }, { status: 400 });

  const existingSlugs = new Set((await db.page.findMany({ where: { siteId }, select: { slug: true } })).map((p) => p.slug));

  const toCreate = template.pages.filter((p) => !existingSlugs.has(p.slug));
  const skipped = template.pages.filter((p) => existingSlugs.has(p.slug)).map((p) => p.slug || "(home)");

  const created = await db.$transaction(async (tx) => {
    if (toCreate.some((p) => p.isHome)) {
      await tx.page.updateMany({ where: { siteId, isHome: true }, data: { isHome: false } });
    }
    const pages = [];
    for (const p of toCreate) {
      const content = siteTemplatePageContent(template.id, p.slug);
      pages.push(
        await tx.page.create({
          data: {
            siteId,
            title: p.title,
            slug: p.slug,
            isHome: p.isHome,
            draftContent: (content ?? { version: 1, root: { id: crypto.randomUUID(), type: "section", props: {}, style: { base: {} } } }) as unknown as Prisma.InputJsonValue,
          },
        }),
      );
    }
    return pages;
  });

  return NextResponse.json({ created, skipped }, { status: 201 });
}
