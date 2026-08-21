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
- **Image transforms/optimization** — on-the-fly resize/format (webp/avif)
  and responsive `srcset` generation, likely via `next/image` loader
  pointed at a transform endpoint, or a service like `imgproxy`.
- **Video handling** — upload size limits, transcoding or at minimum
  duration/dimension metadata extraction.
- **Asset library UX** — search/filter by name, folders/tags, usage
  tracking (which pages reference a given asset, to warn before delete).
- **Alt text / accessibility metadata** enforced at upload time (ties to
  SEO in integrations.md).
- **Quota / storage limits per site** if this ever needs to support
  multi-tenant hosting economics.
