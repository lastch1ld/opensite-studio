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

// Fonts are uploaded through app/api/sites/[siteId]/fonts rather than the
// image routes, so they get an allowlist of their own instead of widening
// the one above — an image upload has no business being a font, or the
// reverse. It's keyed by extension because browsers routinely send an empty
// or generic type for .ttf/.otf (see lib/siteSettings.ts's
// customFontFormat), which makes `file.type` useless as a gate here; the
// type that gets *stored* is then derived from the extension, so a forged
// `file.type` never reaches the Media row or the serve route's
// Content-Type header.
const FONT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

const FONT_EXTENSION_BY_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(FONT_TYPE_BY_EXTENSION).map(([extension, type]) => [type, extension]),
);

/** The canonical font type for an upload's filename, or null if it isn't one. */
export function fontTypeForFilename(filename: string): string | null {
  const lower = filename.toLowerCase();
  const extension = Object.keys(FONT_TYPE_BY_EXTENSION).find((candidate) => lower.endsWith(candidate));
  return extension ? FONT_TYPE_BY_EXTENSION[extension] : null;
}

/** Returns an error message, or null when the font file may be stored. */
export function validateFontUpload(file: File): string | null {
  if (!fontTypeForFilename(file.name)) {
    return "File must be a .woff2, .woff, .ttf, or .otf font file.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File is too large (max ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB).`;
  }
  return null;
}

function extensionFor(mimeType: string): string {
  return EXTENSION_BY_TYPE[mimeType] ?? FONT_EXTENSION_BY_TYPE[mimeType] ?? "";
}

// Raster uploads are re-encoded to WebP on the way in. A self-hosted site
// serves its own bytes, so a 4MB phone photo dropped into a hero is the
// owner's own LCP and bandwidth — and nobody hand-optimises images before
// uploading them. WebP at q80 is typically 25-35% of an unoptimised JPEG
// and a small fraction of a PNG photo, at no visible cost.
//
// SVG is passed through untouched: it's already small, it's vector, and
// rasterising it would be a downgrade. GIF too — re-encoding would drop
// animation, and a still WebP is not what someone uploading a GIF asked
// for.
const RECOMPRESS_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];

// Nothing on a page needs more than this, and it's the difference between
// a 12MP camera original and something a browser can decode quickly.
export const MAX_IMAGE_WIDTH = 2400;
const WEBP_QUALITY = 80;

export type ProcessedImage = { buffer: Buffer; mimeType: string; extension: string; width?: number; height?: number };

/**
 * Re-encodes a raster upload to WebP, capped at MAX_IMAGE_WIDTH. Returns
 * the input unchanged for types that shouldn't be touched, and — because a
 * failed optimisation is never a reason to lose someone's upload — also
 * for anything sharp can't read.
 */
export async function processImage(buffer: Buffer, mimeType: string): Promise<ProcessedImage> {
  const passthrough: ProcessedImage = { buffer, mimeType, extension: extensionFor(mimeType) };
  if (!RECOMPRESS_TYPES.includes(mimeType)) return passthrough;

  try {
    const sharp = (await import("sharp")).default;
    const image = sharp(buffer, { animated: false });
    const meta = await image.metadata();
    const needsResize = Boolean(meta.width && meta.width > MAX_IMAGE_WIDTH);
    const resized = needsResize ? image.resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true }) : image;
    const out = await resized.webp({ quality: WEBP_QUALITY }).toBuffer({ resolveWithObject: true });
    // A re-encode that came out bigger is not an optimisation — an
    // already-optimised WebP, a flat-color PNG that Deflate handles better
    // than any lossy codec. Keep the original, unless it also needed
    // resizing, in which case the dimension cap is the point and worth the
    // bytes.
    if (!needsResize && out.data.byteLength >= buffer.byteLength) return passthrough;
    return {
      buffer: Buffer.from(out.data),
      mimeType: "image/webp",
      extension: ".webp",
      width: out.info.width,
      height: out.info.height,
    };
  } catch {
    return passthrough;
  }
}

// Saves an uploaded file under `${MEDIA_STORAGE_PATH}/{siteId}/{uuid}.{ext}`
// and returns the storage key, the URL it's served from
// (app/api/media/[siteId]/[file]), and the type it was actually stored as —
// which is not necessarily the type it arrived as, see processImage.
// `storeAsMimeType` overrides the type the file is stored *as*, for callers
// that have already established it more reliably than `file.type` can —
// the fonts route derives it from the validated extension. Everything
// downstream (the extension on disk, the returned mimeType) follows from
// it, so it is never a client-supplied string.
export async function saveMediaFile(
  siteId: string,
  file: File,
  storeAsMimeType?: string,
): Promise<{ storageKey: string; url: string; mimeType: string; width?: number; height?: number }> {
  // MEDIA_STORAGE_PATH is a runtime-configured mounted volume outside the
  // build output, not a project file — exclude it from Turbopack's output
  // file tracing (it would otherwise try to bundle the whole project).
  const dir = path.join(/* turbopackIgnore: true */ storageRoot(), siteId);
  await mkdir(dir, { recursive: true });

  const processed = await processImage(Buffer.from(await file.arrayBuffer()), storeAsMimeType ?? file.type);
  const filename = `${randomUUID()}${processed.extension}`;
  await writeFile(path.join(/* turbopackIgnore: true */ dir, filename), processed.buffer);

  return {
    storageKey: filename,
    url: `/api/media/${siteId}/${filename}`,
    mimeType: processed.mimeType,
    width: processed.width,
    height: processed.height,
  };
}
