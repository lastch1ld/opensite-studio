import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

// Public route (no auth) — matches the public renderer serving published
// pages that reference these URLs. Only serves files with a matching Media
// row, and resolves strictly within that site's storage subfolder.
export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string; file: string }> }) {
  const { siteId, file } = await params;
  if (file.includes("..") || file.includes("/") || file.includes("\\")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const media = await db.media.findFirst({ where: { siteId, storageKey: file } });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const storageRoot = process.env.MEDIA_STORAGE_PATH || "/data/media";
  try {
    // See lib/media.ts — this path is a runtime volume, not a project file.
    const buffer = await readFile(path.join(/* turbopackIgnore: true */ storageRoot, siteId, file));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": media.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        // Defense in depth behind lib/media.ts's upload allowlist: these
        // bytes are served from the app's own origin, so anything that
        // slipped past the allowlist (or was stored before it existed)
        // still can't sniff its way into being a script, and an SVG opened
        // as a top-level document runs in a sandbox with no origin.
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
