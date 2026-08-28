import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { actorHasScope, getRequestActor } from "@/lib/apiAuth";
import { auditPageContent } from "@/lib/a11y";
import { DEFAULT_THEME_TOKENS, type ThemeTokens } from "@/lib/theme";
import type { PageContent } from "@/components/blocks/types";

// Scans every page of a site for the accessibility problems that are
// decidable from the block tree (lib/a11y.ts). Reads draft content by
// default — the point is to catch a problem before it's published;
// `?published=1` audits what's actually live instead.
export async function GET(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const actor = await getRequestActor(req, siteId);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!actorHasScope(actor, "read")) {
    return NextResponse.json({ error: "This API key's scopes don't allow read access." }, { status: 403 });
  }

  const site = await requireSiteRole(siteId, actor.userId, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const published = new URL(req.url).searchParams.get("published") === "1";
  const [pages, theme] = await Promise.all([
    db.page.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } }),
    db.theme.findUnique({ where: { siteId } }),
  ]);
  const tokens = (theme?.tokens as unknown as ThemeTokens) ?? DEFAULT_THEME_TOKENS;

  const results = pages.map((page) => {
    const content = (published ? page.publishedContent : page.draftContent) as unknown as PageContent | null;
    return {
      pageId: page.id,
      title: page.title,
      slug: page.slug,
      // A page with no content of the requested kind (never published, in
      // the published case) is reported as such rather than as "clean" —
      // zero issues on a page that wasn't scanned is a misleading pass.
      scanned: Boolean(content),
      issues: content ? auditPageContent(content, tokens) : [],
    };
  });

  return NextResponse.json({
    scanned: published ? "published" : "draft",
    pages: results,
    totals: {
      errors: results.reduce((n, p) => n + p.issues.filter((i) => i.severity === "error").length, 0),
      warnings: results.reduce((n, p) => n + p.issues.filter((i) => i.severity === "warning").length, 0),
    },
  });
}
