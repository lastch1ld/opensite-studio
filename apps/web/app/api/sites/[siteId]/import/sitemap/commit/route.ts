import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { emptyPageContent } from "@/lib/pageContent";
import type { Prisma } from "@prisma/client";

type CommitEntry = { slug: string; title: string; isHome: boolean; parentSlug: string | null };

// Creates the reviewed/checked entries as empty Page shells. Never
// clobbers an existing page: a slug that already exists on the Site is
// skipped (docs/content-import.md "Slug collisions") — the client is
// expected to have already resolved any collisions it wants created
// (e.g. disambiguated to "about-2") before calling this.
export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const entries = Array.isArray(body?.entries) ? (body.entries as CommitEntry[]) : null;
  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: "entries is required" }, { status: 400 });
  }
  for (const e of entries) {
    if (typeof e.slug !== "string" || !/^[a-z0-9-]*(\/[a-z0-9-]+)*$/.test(e.slug) || typeof e.title !== "string" || !e.title.trim()) {
      return NextResponse.json({ error: "Invalid entry: slug/title malformed." }, { status: 400 });
    }
  }

  const existingPages = await db.page.findMany({ where: { siteId } });
  const slugToId = new Map(existingPages.map((p) => [p.slug, p.id]));

  const created: { slug: string; title: string; id: string; isHome: boolean }[] = [];
  const skipped: string[] = [];

  const sorted = [...entries].sort((a, b) => a.slug.split("/").length - b.slug.split("/").length);
  for (const entry of sorted) {
    if (slugToId.has(entry.slug)) {
      skipped.push(entry.slug);
      continue;
    }
    const parentId = entry.parentSlug ? slugToId.get(entry.parentSlug) ?? null : null;
    const page = await db.page.create({
      data: {
        siteId,
        slug: entry.slug,
        title: entry.title.trim(),
        isHome: Boolean(entry.isHome),
        parentId,
        draftContent: emptyPageContent() as unknown as Prisma.InputJsonValue,
      },
    });
    slugToId.set(entry.slug, page.id);
    created.push({ slug: page.slug, title: page.title, id: page.id, isHome: page.isHome });
  }

  return NextResponse.json({ created, skipped });
}
