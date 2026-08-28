# Media

## MVP `[ ]`

- Local filesystem storage under a mounted volume (`/data/media`), one
  subfolder per site. Upload API route: multipart POST → save file → create
  `Media` row (data-model.md) → return URL.
- Served via a simple `app/api/media/[siteId]/[file]` route (or directly by
  the reverse proxy in deployment.md if mounted as static).
- Editor's `image` block "choose image" opens a basic grid of the site's
  uploaded Media to pick from, plus a raw upload button.

## Needed for full parity `[ ]`

- **Pluggable storage backend** — S3-compatible (MinIO/S3/R2) as an
  alternative to local disk, selected via env config, so self-hosters
  aren't stuck with local-disk-only storage on scale-out deployments.
- **Image transforms/optimization** — half built (2026-08-28). Uploads are
  now processed once on the way in rather than transformed on the way out
  (`lib/media.ts`'s `processImage`, using `sharp`): raster images are
  re-encoded to WebP at q80 and capped at 2400px wide, and the `Media`
  row records the type it was actually stored as. SVG and GIF pass through
  untouched (vector; possibly animated), and anything that fails to decode
  — or that re-encodes *larger*, which flat-color PNGs do — keeps its
  original bytes, since a failed optimisation must never cost someone
  their upload.

  Deliberately not done: **responsive `srcset`**. That needs per-width
  derivatives stored against the `Media` row and a way for the `image`
  block to find them from a bare URL string, which is a renderer change
  rather than an upload change. The single-encode pass above is where
  most of the bytes are; srcset is the next step, not a finished one.
- **Upload limits** — 10MB per file and an explicit type allowlist
  (`ALLOWED_UPLOAD_TYPES`), enforced on both the authenticated upload
  route and the public form-submission endpoint. See
  [audit-2026-08.md](audit-2026-08.md) for why the allowlist is a
  security boundary rather than a convenience filter.
- **Video handling** — upload size limits, transcoding or at minimum
  duration/dimension metadata extraction.
- **Asset library UX** — search/filter by name, folders/tags, usage
  tracking (which pages reference a given asset, to warn before delete).
- **Alt text / accessibility metadata** enforced at upload time (ties to
  SEO in integrations.md).
- **Quota / storage limits per site** if this ever needs to support
  multi-tenant hosting economics.
