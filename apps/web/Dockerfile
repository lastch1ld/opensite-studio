# Build context is the repo root (see ../../docker-compose.yml) — this app
# is one workspace in an npm workspaces monorepo (root package.json:
# "workspaces": ["apps/*", "packages/*"]) since docs/plugin-sdk.md's
# @opensite/block-sdk / @opensite/plugin-api extraction, so `npm ci` needs
# to see the whole workspace, not just apps/web in isolation.
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/block-sdk/package.json packages/block-sdk/package.json
COPY packages/plugin-api/package.json packages/plugin-api/package.json
# @prisma/client's postinstall runs `prisma generate`, which needs the
# schema present at `npm ci` time.
COPY apps/web/prisma apps/web/prisma
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema apps/web/prisma/schema.prisma
RUN npm run build --workspace=web

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/apps/web

EXPOSE 3000
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
CMD ["npm", "start"]
