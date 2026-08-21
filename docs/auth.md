# Auth

## MVP `[x]`

- NextAuth with **Credentials provider** (email + password, bcrypt-hashed)
  plus Prisma adapter for session storage. OAuth providers (Google/GitHub)
  are config-only additions later — deferred, not architecturally blocked.
- Single implicit role per site: whoever owns the `Site` row can edit it.
  No sharing/collaboration yet.
- Route protection: middleware guards `(dashboard)` and `(editor)` route
  groups, redirecting unauthenticated requests to `/login`. Public renderer
  routes are always open (no auth check) — publishing is what makes content
  public, not a permissions check.
- Passwords: bcrypt via `bcryptjs`, min length + basic strength check
  client + server side. Session strategy: database sessions (not JWT), so a
  session can be revoked server-side (needed later for "log out other
  devices" / admin account suspension).

## Needed for full parity `[ ]`

- **Membership-based roles per site** (OWNER/EDITOR/VIEWER) instead of a
  single owner — required for team collaboration, a standard Wix/Elementor
  feature (inviting a designer/client). Backed by the `Membership` table in
  data-model.md.
- **Invite flow** — email invite token → accept → creates Membership.
- **Granular permissions** — e.g. EDITOR can edit content but not
  publish/delete site, VIEWER is read-only preview access. Enforced in
  `lib/permissions.ts` on every mutating API route, not just at page load.
- **OAuth providers** (Google at minimum) — config addition to existing
  NextAuth setup.
- **Email verification** for credentials signup, and password reset flow
  (requires transactional email — see deployment.md for SMTP config).
- **Org/workspace layer** above Site if one login should manage many sites
  under a team (Wix has this via "My Sites"; MVP treats Sites as flat,
  owned individually).
- **Public visitor auth** (separate from CMS-author auth) — needed only if
  a built site itself wants gated/member content (Wix Members Area
  equivalent). Explicitly out of scope until a site owner needs it; would be
  its own subsystem, not an extension of author auth.
- **Audit log** of who changed/published what (ties to Revision.createdById
  in data-model.md).
