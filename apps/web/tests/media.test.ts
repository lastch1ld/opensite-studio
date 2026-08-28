import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { ALLOWED_UPLOAD_TYPES, MAX_IMAGE_WIDTH, MAX_UPLOAD_BYTES, processImage, validateUpload } from "@/lib/media";

const file = (type: string, size: number) => ({ type, size, name: "x" }) as File;

// A photo-like source. Flat color compresses so well in every format that
// size comparisons say nothing, and pure noise is the opposite pathology
// (PNG's Deflate beats any lossy codec on it) — a smooth gradient with a
// little grain is what an actual uploaded photo looks like to a codec.
async function photoPng(width: number, height: number): Promise<Buffer> {
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const grain = ((x * 7 + y * 13) % 11) - 5;
      pixels[i] = Math.max(0, Math.min(255, Math.round((x / width) * 220) + grain));
      pixels[i + 1] = Math.max(0, Math.min(255, Math.round((y / height) * 200) + grain));
      pixels[i + 2] = Math.max(0, Math.min(255, 140 + grain * 3));
    }
  }
  return sharp(pixels, { raw: { width, height, channels: 3 } }).png().toBuffer();
}

describe("validateUpload", () => {
  it("accepts the allowed image types", () => {
    for (const type of ALLOWED_UPLOAD_TYPES) {
      expect(validateUpload(file(type, 1000)), type).toBeNull();
    }
  });

  it("rejects a forged content type", () => {
    // The whole point: file.type is client-supplied, so this is the check
    // standing between an upload and an HTML document served on our origin.
    expect(validateUpload(file("text/html", 1000))).toMatch(/Unsupported file type/);
    expect(validateUpload(file("application/javascript", 1000))).toMatch(/Unsupported file type/);
    expect(validateUpload(file("", 1000))).toMatch(/Unsupported file type/);
  });

  it("rejects an oversized file", () => {
    expect(validateUpload(file("image/png", MAX_UPLOAD_BYTES + 1))).toMatch(/too large/);
    expect(validateUpload(file("image/png", MAX_UPLOAD_BYTES))).toBeNull();
  });
});

describe("processImage", () => {
  it("re-encodes a PNG to WebP and makes it smaller", async () => {
    const png = await photoPng(600, 400);
    const out = await processImage(png, "image/png");
    expect(out.mimeType).toBe("image/webp");
    expect(out.extension).toBe(".webp");
    expect(out.buffer.byteLength).toBeLessThan(png.byteLength);
    expect(await sharp(out.buffer).metadata()).toMatchObject({ format: "webp", width: 600, height: 400 });
  });

  it("caps width and keeps the aspect ratio", async () => {
    const wide = await photoPng(3200, 1600);
    const out = await processImage(wide, "image/png");
    const meta = await sharp(out.buffer).metadata();
    expect(meta.width).toBe(MAX_IMAGE_WIDTH);
    expect(meta.height).toBe(MAX_IMAGE_WIDTH / 2);
  });

  it("does not enlarge a small image", async () => {
    const small = await photoPng(120, 90);
    const meta = await sharp((await processImage(small, "image/png")).buffer).metadata();
    expect(meta.width).toBe(120);
  });

  it("passes SVG and GIF through untouched", async () => {
    // SVG is vector and GIF may be animated — re-encoding either is a
    // downgrade, not an optimisation.
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>');
    const svgOut = await processImage(svg, "image/svg+xml");
    expect(svgOut.mimeType).toBe("image/svg+xml");
    expect(svgOut.buffer).toBe(svg);

    const gif = await sharp(await photoPng(20, 20)).gif().toBuffer();
    const gifOut = await processImage(gif, "image/gif");
    expect(gifOut.mimeType).toBe("image/gif");
    expect(gifOut.buffer).toBe(gif);
  });

  it("returns the original rather than losing the upload when the bytes aren't decodable", async () => {
    const notAnImage = Buffer.from("this is not a png");
    const out = await processImage(notAnImage, "image/png");
    expect(out.buffer).toBe(notAnImage);
    expect(out.mimeType).toBe("image/png");
    expect(out.extension).toBe(".png");
  });

  it("keeps an already-optimised WebP rather than growing it", async () => {
    const tiny = await sharp(await photoPng(40, 40)).webp({ quality: 20 }).toBuffer();
    const out = await processImage(tiny, "image/webp");
    expect(out.buffer.byteLength).toBeLessThanOrEqual(tiny.byteLength);
  });
});
