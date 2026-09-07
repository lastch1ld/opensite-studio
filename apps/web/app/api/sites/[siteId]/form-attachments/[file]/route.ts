import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { requireSiteRole } from "@/lib/permissions";

// Files attached to form submissions (app/api/forms/submit). They get no
// Media row by design (docs/forms.md keeps submitter files out of the
// site's media library), which means the public /api/media route — which
// requires one — will never serve them. They're read back here instead,
// behind a membership check: a file a stranger uploaded through a public
// form should be visible to the site's team in the Submissions panel, not
// to anyone holding the URL.
export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string; file: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, file } = await params;
  if (file.includes("..") || file.includes("/") || file.includes("\\")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const storageRoot = process.env.MEDIA_STORAGE_PATH || "/data/media";
  try {
    // See lib/media.ts — this path is a runtime volume, not a project file.
    const buffer = await readFile(path.join(/* turbopackIgnore: true */ storageRoot, siteId, file));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        // Served as a download with a generic type rather than rendered:
        // these bytes came from an unauthenticated stranger, and the person
        // opening them is signed into the dashboard on this very origin.
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
