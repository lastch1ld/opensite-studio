import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function storageRoot(): string {
  return process.env.MEDIA_STORAGE_PATH || "/data/media";
}

function extensionFor(mimeType: string, originalName: string): string {
  const fromName = path.extname(originalName);
  if (fromName) return fromName;
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
  };
  return map[mimeType] ?? "";
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

  const ext = extensionFor(file.type, file.name);
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(/* turbopackIgnore: true */ dir, filename), buffer);

  return { storageKey: filename, url: `/api/media/${siteId}/${filename}` };
}
