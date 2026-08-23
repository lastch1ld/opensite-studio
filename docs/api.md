# Public API

Implements `docs/programmatic-access.md`'s "surface 1": the existing
internal `app/api/sites/**` route handlers *are* the public API contract,
not a separate set of routes. This doc is the "versioned" contract that doc
asked for.

## Why no `/api/v1/` prefix

The dashboard/editor UI and CLI/MCP now call the exact same route handlers
— forking a parallel `/api/v1/**` tree would mean either duplicating every
handler (violates AGENTS.md rule 5, "no premature abstractions") or having
the UI call `/api/v1/**` too (a pointless rename with no behavior change).
Versioning is instead handled the way a single-tenant, self-hosted app
normally does: this doc pins down the current request/response shape per
route, and a breaking change to any route documented here gets called out
as such in `docs/roadmap.md` (and, if this project ever needs to support
old and new clients simultaneously, *that's* the point where a real
`/api/v2/` split would be justified — not before).

## Authentication

Two methods, resolved by `lib/apiAuth.ts#getRequestActor` (tries session
first, falls back to API key) for every route listed below:

1. **NextAuth session** (cookie) — what the dashboard/editor UI uses. Full
   access to whatever the signed-in user's Membership/ownership role allows,
   unrestricted by scopes.
2. **API key** — `Authorization: Bearer osk_live_<...>` header. What the
   CLI and MCP server use. See below.

Routes not listed in "Public v1 contract" remain session-only for now (see
that section for the list and why).

## API keys

Created via the dashboard (Site → API keys panel, OWNER-only) or
`POST /api/sites/:siteId/api-keys`. A key is:

- **Scoped to exactly one Site** — `ApiKey.siteId`. There is no
  cross-site or instance-wide key; a CLI/MCP client authenticates against
  one Site per key.
- **Capped by its creator's current role.** A key doesn't carry a role of
  its own — every request re-derives the role via
  `getSiteRole(siteId, apiKey.createdByUserId)`, the exact same function
  session auth uses. If the creator's Membership role changes (or is
  removed) after the key was minted, the key's effective power changes with
  it on the very next request — a key can never outlive or exceed its
  creator's real access. This falls out for free from routing the key's
  `createdByUserId` through the same `requireSiteRole`/`requirePageRole`
  calls the UI routes already made; there's no separate authorization path
  to keep in sync.
- **Further narrowed by `scopes`.** Independent of role, a key also carries
  a `scopes: string[]` (see below) that additionally restricts which kinds
  of requests it can make. Scopes only ever narrow — they can't grant
  something the underlying role wouldn't already allow.
- **Shown once.** The raw key (`osk_live_<random>`) is returned only in the
  `POST /api-keys` response body. Only its SHA-256 hash is persisted
  (`ApiKey.hashedKey`); there's no "reveal" endpoint. `ApiKey.keyPrefix`
  (first 17 chars) is stored in the clear so the dashboard can show which
  key is which without ever re-displaying the secret.
- **Revocable, not deletable.** `DELETE /api-keys/:keyId` sets
  `revokedAt`; the row (and its `lastUsedAt` history) stays for audit
  purposes, same pattern as `Invitation.acceptedAt`.

### Scopes

| Scope     | Grants                                                             |
| --------- | ------------------------------------------------------------------ |
| `read`    | `GET`/list/detail routes — sites, pages, collections, media, forms |
| `write`   | Content mutations — create/update/delete pages, collections, items |
| `publish` | The publish route only (`POST .../pages/:pageId/publish`)          |

Scopes are independent flags, not a hierarchy — a CI key can be created
with `["publish"]` only (per `programmatic-access.md`'s "publish-only key
for a CI pipeline" example) and it will be rejected (`403`) on any `write`
or `read` route even though its underlying role might otherwise allow it.
A key is created with all three by default if `scopes` is omitted.

### Creating a key

```
POST /api/sites/:siteId/api-keys
Authorization: <session cookie>   (OWNER role required)
{ "name": "CI pipeline", "scopes": ["read", "publish"] }

201 { "id", "name", "keyPrefix", "scopes", "createdAt", "key": "osk_live_..." }
```

`key` is the only place the raw secret ever appears. `GET` and the create
response's stored fields never include it again.

### Revoking a key

```
DELETE /api/sites/:siteId/api-keys/:keyId
Authorization: <session cookie>   (OWNER role required)

200 { "id", "revokedAt" }
```

### Management endpoints are session-only

`POST`/`GET`/`DELETE` on `/api-keys` themselves are OWNER-only and
session-auth-only — an API key can't be used to mint or revoke API keys
(including itself). This mirrors treating key management as
equivalent-sensitivity to deleting the Site or managing Members, which
auth.md doesn't yet have a delegable EDITOR-level permission for.

## Public v1 contract

Every route below accepts both auth methods and enforces permissions via
`lib/permissions.ts` exactly as the dashboard UI does (`OWNER`/`EDITOR`/
`VIEWER` per `getSiteRole`/`requireSiteRole`/`requirePageRole`), with the
scope additionally required for API-key auth noted in parens.

- `GET /api/sites` (`read`) — list sites the caller belongs to (API-key
  auth returns just that key's one Site)
- `DELETE /api/sites/:siteId` (`write`, OWNER only)
- `GET /api/sites/:siteId/pages` (`read`)
- `POST /api/sites/:siteId/pages` (`write`)
- `GET /api/sites/:siteId/pages/:pageId` (`read`) — single page incl.
  draftContent/publishedContent; not used by the editor UI itself (which
  SSR-reads the page directly) but added for the CLI/MCP's benefit
- `PATCH /api/sites/:siteId/pages/:pageId` (`write`) — draftContent,
  collectionId, seo, isHome
- `DELETE /api/sites/:siteId/pages/:pageId` (`write`)
- `POST /api/sites/:siteId/pages/:pageId/publish` (`publish`, OWNER only —
  draftContent → publishedContent + Revision snapshot)
- `GET /api/sites/:siteId/pages/:pageId/submissions` (`read`)
- `GET /api/sites/:siteId/collections` (`read`)
- `POST /api/sites/:siteId/collections` (`write`)
- `GET /api/sites/:siteId/collections/:collectionId/items` (`read`)
- `POST /api/sites/:siteId/collections/:collectionId/items` (`write`)
- `PATCH /api/sites/:siteId/collections/:collectionId/items/:itemId` (`write`)
- `DELETE /api/sites/:siteId/collections/:collectionId/items/:itemId` (`write`)
- `GET /api/sites/:siteId/media` (`read`)

### Deliberately left session-only this pass

Everything else under `app/api/sites/[siteId]/**` (domain verification,
theme, saved-blocks, templates, settings/secrets, sitemap/content import,
AI Mode chat/auth, invitations, `POST /api/sites` create, `POST
/api/sites/:siteId/media` upload, `POST /api/sites/:siteId/collections/:id`
single-collection detail/update, and API key management itself) still
requires a session. None of these are architecturally blocked from
API-key auth — `getRequestActor`/`actorHasScope` work the same way for any
route — they just weren't in this pass's "most important routes" sample
(`programmatic-access.md`'s scoping note) and the CLI/MCP server built
alongside this doc don't need them yet. Extending a given route later is a
2-3 line change per route (see any of the routes listed above as a
template), not a redesign.

## Errors

Same shape as the existing UI routes: `{ "error": "<message>" }` with the
matching status code. An API key that fails to authenticate (missing,
malformed, unknown, revoked, or scoped to a different Site than the URL's
`:siteId`) yields `401`, same as no session. An authenticated key whose
`scopes` don't cover the action yields `403`.
