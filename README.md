# OpenSite Studio

Self-hosted, open-source alternative to Wix/Elementor: sign up, create a
site, edit pages live in a visual block editor, publish, and serve the
result publicly. See [docs/](docs/) for the full design, and
[docs/roadmap.md](docs/roadmap.md) for what's built and what isn't.

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

## Custom domains

A site owner can add a custom domain from the site's Settings page: enter the
domain, add the DNS TXT record it shows you (proves ownership), then click
Verify. Once verified, point the domain's DNS (A/CNAME) at your server and
run the bundled reverse proxy in front of `web`:

```sh
docker compose --profile proxy up --build
```

`caddy` (see `Caddyfile`) issues Let's Encrypt certificates on demand for
verified domains, asking the app (`/api/domains/verify-ask`) before it
requests each one — no manual cert config needed as domains are added.

## Project layout

- `apps/web` — the Next.js app (App Router): dashboard, editor, public
  renderer, API routes, Prisma schema.
- `docs/` — design docs; `docs/roadmap.md` tracks what's built vs deferred.
