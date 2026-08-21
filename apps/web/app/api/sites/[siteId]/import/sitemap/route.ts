import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireSiteRole } from "@/lib/permissions";
import { importFromRootUrl, importFromSitemapText, importFromSitemapUrl } from "@/lib/sitemapImport";

// Parses a sitemap.xml URL, an uploaded sitemap file, or (as a fallback)
// crawls from a root URL — returns a preview to review before any Page is
// created (see the /commit route). One-time action, not a stored/ongoing
// sync (docs/content-import.md).
export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  const sitemapUrl = formData.get("sitemapUrl");
  const rootUrl = formData.get("rootUrl");

  try {
    if (file instanceof File) {
      const text = await file.text();
      const result = importFromSitemapText(text);
      if (result.entries.length === 0) {
        return NextResponse.json({ error: "No <loc> URLs found in the uploaded file." }, { status: 400 });
      }
      return NextResponse.json(result);
    }
    if (typeof sitemapUrl === "string" && sitemapUrl.trim()) {
      return NextResponse.json(await importFromSitemapUrl(sitemapUrl.trim()));
    }
    if (typeof rootUrl === "string" && rootUrl.trim()) {
      return NextResponse.json(await importFromRootUrl(rootUrl.trim()));
    }
    return NextResponse.json({ error: "Provide a sitemap file, sitemapUrl, or rootUrl." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Import failed." }, { status: 400 });
  }
}
