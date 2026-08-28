import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function storageRoot(): string {
  return process.env.MEDIA_STORAGE_PATH || "/data/media";
}

// The upload allowlist is a security boundary, not a convenience filter:
// uploads are served back from this app's own origin
// (app/api/media/[siteId]/[file]), so a file stored as text/html — or an
// SVG opened as a top-level document — would run script against the
// dashboard session of whoever opened it. `file.type` is client-supplied
// and trivially forged, so the extension is derived from the validated
// type here and the original filename is never trusted for it.
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
};

export const ALLOWED_UPLOAD_TYPES = Object.keys(EXTENSION_BY_TYPE);

// App Router route handlers have no default body-size limit, and one of the
// two upload paths (form submissions) is unauthenticated — without a cap,
// filling the media volume costs an attacker one request.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Returns an error message, or null when the file may be stored. */
export function validateUpload(file: File): string | null {
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    return `Unsupported file type. Allowed: ${ALLOWED_UPLOAD_TYPES.join(", ")}.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File is too large (max ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB).`;
  }
  return null;
}

function extensionFor(mimeType: string): string {
  return EXTENSION_BY_TYPE[mimeType] ?? "";
}

// Saves an uploaded file under `${MEDIA_STORAGE_PATH}/{siteId}/{uuid}.{ext}`
// and returns the storage key + the URL it's served from (app/api/media/[siteId]/[file]).
export async function saveMediaFile(
  siteId: string,
  file: File,
): Promise<{ storageKey: string; url: string }> {
  // MEDIA_STORAGE_PATH is a runtime-configured mounted volume outside the
  // build output, not a project file — exclude it from Turbopack's output
  // file tracing (it would otherwise try to bundle the whole project).
  const dir = path.join(/* turbopackIgnore: true */ storageRoot(), siteId);
  await mkdir(dir, { recursive: true });

  const ext = extensionFor(file.type);
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(/* turbopackIgnore: true */ dir, filename), buffer);

  return { storageKey: filename, url: `/api/media/${siteId}/${filename}` };
}
