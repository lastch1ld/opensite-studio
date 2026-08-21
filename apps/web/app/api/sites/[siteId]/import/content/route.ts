import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireSiteRole } from "@/lib/permissions";
import { safeFetchText } from "@/lib/safeFetch";
import { extractContentFragments } from "@/lib/htmlExtract";

// Content clipboard (docs/content-import.md Feature 2): fetches a
// user-supplied URL's HTML and reduces it to a flat list of text
// fragments. Nothing is written to any Page here — the client stages the
// result in memory and inserts fragments into blocks one at a time.
export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { url } = await req.json();
  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    const html = await safeFetchText(url.trim());
    const fragments = extractContentFragments(html);
    return NextResponse.json({ fragments, sourceUrl: url.trim() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fetch failed." }, { status: 400 });
  }
}
