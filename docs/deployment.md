# Deployment (Self-Hosting)

## MVP `[ ]`

- `docker-compose.yml` with two services: `web` (the Next.js app, built
  from a `Dockerfile`) and `db` (Postgres). Media stored on a mounted
  volume (media.md).
- Config entirely via environment variables: `DATABASE_URL`,
  `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `APP_DOMAIN` (base domain subdomains
  are minted under), `MEDIA_STORAGE_PATH`.
- `.env.example` documenting every variable.
- Prisma migrations run as a one-shot step (`prisma migrate deploy`) on
  container start, not applied by hand.
- README quickstart: clone → copy `.env.example` → `docker compose up` →
  visit `:3000`, create first account.

## Needed for full parity `[ ]`

- **Reverse proxy for custom domains + TLS** — Caddy or Traefik in front of
  `web`, handling automatic Let's Encrypt certs per verified custom domain
  (renderer.md `Domain` verification flow).
- **Object storage backend option** (S3/MinIO) instead of local volume,
  for scale-out/multi-instance deployment (media.md).
- **Backups** — documented (and ideally scripted) Postgres dump + media
  volume backup strategy.
- **Horizontal scaling** — currently a single `web` container assumption;
  moving to multiple replicas needs session store and any in-memory state
  (autosave debouncing, etc.) to be verified stateless-safe.
- **SMTP config** for transactional email (auth.md password
  reset/verification, integrations.md newsletter provider is separate from
  this — this is the CMS's own outbound mail).
- **Health check / readiness endpoint** for orchestrators beyond plain
  Compose (k8s, etc.) if that's ever a target.
- **One-click deploy templates** (Railway/Render/Fly.io buttons) as
  alternatives to raw Docker Compose, for less technical self-hosters.
