# OpenSite Studio

Self-hosted, open-source alternative to Wix/Elementor: sign up, create a
site, edit pages live in a visual block editor, publish, and serve the
result publicly. See [docs/](docs/) for the full design; this is the
Phase 0 MVP described in [docs/roadmap.md](docs/roadmap.md).

## Quickstart (Docker Compose)

```sh
git clone <repo-url>
cd opensite-studio
cp .env.example .env
# edit .env and set NEXTAUTH_SECRET (openssl rand -base64 32)
docker compose up --build
```

Visit http://localhost:3000, sign up, create a site and a page, edit it in
the visual editor, and hit Publish.

## Quickstart (local dev)

Requires Node 22+ and a local Postgres instance.

```sh
cd apps/web
cp ../../.env.example .env
# edit .env: point DATABASE_URL at your local Postgres, set NEXTAUTH_SECRET
npm install
npx prisma migrate dev
npm run dev
```

Visit http://localhost:3000.

## Viewing a published site locally

Real subdomain routing (`{subdomain}.{APP_DOMAIN}`) needs DNS or a hosts-file
entry that isn't set up by default. Without `APP_DOMAIN` configured, use the
path-based fallback instead:

```
http://localhost:3000/site/<subdomain>/<page-slug>
```

## Project layout

- `apps/web` — the Next.js app (App Router): dashboard, editor, public
  renderer, API routes, Prisma schema.
- `docs/` — design docs; `docs/roadmap.md` tracks what's built vs deferred.
