# Agent Glossary & Ruleset

Read this before working on OpenSite Studio, whether as a human contributor
or an AI agent picking up a task. It's the accumulated conventions from the
Phase 0–2 build-out, kept here so each new task doesn't have to rediscover
them. See `docs/index.md` for the actual design docs — this file is about
*how to work in this repo*, not *what the product does*.

## Glossary

**Block** — a node in a page's content tree: `{ id, type, props, style,
children?, condition? }`. `type` looks up a renderer in the block registry
(`components/blocks/registry.tsx`). See `docs/blocks-and-theming.md`.

**PageContent** — `{ root: Block, version: number }`, stored as JSON in
`Page.draftContent` / `Page.publishedContent`. Editing mutates the draft;
Publish copies draft → published (and snapshots a `Revision`).

**Shared render codepath** — `BlockRenderer` is the *only* place block
trees get turned into HTML, used identically by the editor canvas and the
public renderer (editor passes extra callback props for selection/drag
chrome; the public renderer doesn't). Never fork this into two rendering
implementations — see `docs/architecture.md`.

**`$token`** — a style value like `{ $token: "colors.primary" }` that
resolves against a Site's `Theme.tokens` instead of being a literal.
Resolved in `lib/responsiveStyle.ts`. See `docs/blocks-and-theming.md`.

**`$bind`** (`BoundValue`) — a prop value that resolves against Collection
data instead of being a literal: `{ $bind: { source: "collection" | "currentItem", ... } }`.
Same resolve-through-one-shared-function pattern as `$token`. See
`docs/collections.md`.

**`Condition`** — the shared boolean-logic type (`always`,
`collectionFieldEquals`, `deviceIs`, `and`/`or`) used for block-level
conditional visibility, Theme Builder template targeting, and (later)
popup triggers. One condition engine, reused everywhere — never invent a
second conditional-logic shape for a new feature. See `docs/collections.md`.

**Template** (Theme Builder) — a saved block tree tagged with a `type`
(`header`/`footer`/`pageTemplate`/`collectionItemTemplate`/`popup`) and a
`Condition` for where it applies. Authored in the same editor as a Page —
not a separate editor implementation. See `docs/theme-builder.md`.

**Collection / CollectionItem** — a user-defined typed dataset scoped to a
Site (`Collection.fieldSchema`) and its rows (`CollectionItem.data`).
Powers dynamic/repeater pages (`Page.collectionId`) and `$bind`. See
`docs/collections.md`.

**Membership / role** — `Site.ownerId` is the implicit OWNER; `Membership`
rows add EDITOR/VIEWER collaborators. Role checks belong in **API route
handlers** (`lib/permissions.ts`), not just UI visibility — a hidden
button is not access control. See `docs/auth.md`.

**Revision** — an immutable snapshot of a Page's content, created on every
Publish. Restore copies a Revision back into `draftContent` only — it
never auto-publishes. See `docs/data-model.md`.

**SavedBlock** — a reusable block subtree, current implementation is
**detached copy** (insert once, then diverges), not linked/symbol-style.
Linked reusable blocks are still open per `docs/editor.md` — don't assume
they exist.

**Site.mode** — (planned, not yet built) distinguishes a normal
block-based `BUILDER` site from a full-page `AI_CHAT` site. See
`docs/ai-mode.md`.

## Ruleset for agents working on this repo

1. **Read the relevant docs first.** Every feature has a design doc under
   `docs/` written *before* implementation. Follow it — don't redesign
   from scratch. If a doc is ambiguous or wrong once you're in the code,
   implement the reasonable interpretation and say so in your report;
   don't silently deviate without noting it.

2. **Scope discipline.** Implement exactly the assigned item(s), nothing
   adjacent. If you notice something else that's broken or missing,
   report it — don't fix it in the same pass unless asked.

3. **One shared render codepath.** Editor canvas and public renderer must
   never fork. New resolution mechanisms (`$bind`, `Condition`, future
   ones) follow the existing `$token` pattern in `lib/responsiveStyle.ts`:
   one resolve function, called from both sides.

4. **Permissions are enforced server-side.** Any new mutating API route
   under `app/api/sites/**` must call through `lib/permissions.ts`
   (`requireSiteRole`/`requirePageRole`/`requireSiteOwner`). UI-level
   hiding of controls is a secondary nicety, never the actual gate.

5. **No premature abstractions.** No speculative error handling, no
   comments explaining *what* code does (only non-obvious *why*), and no
   new `packages/` entry without a real second consumer. (`block-sdk` and
   `plugin-api` are there because the plugin SDK became one —
   `docs/architecture.md`'s own exception. The rule bars anticipating a
   consumer, not extracting for one that exists.)

6. **Verify before reporting done.** Inside `apps/web`: `npx tsc
   --noEmit`, `npm run build`, `npx eslint .` must all pass clean. If you
   touched `schema.prisma`, run `npx prisma generate` to confirm it's
   valid. There is usually no live Postgres available in this
   environment — don't attempt `prisma migrate dev`; instead leave a note
   (see convention below) that a migration still needs generating.

7. **Migration note convention.** Every doc/agent run that adds a Prisma
   model appends to (or creates) a note in `docs/roadmap.md`'s relevant
   phase section: *"a Prisma migration for the new `X` table still needs
   to be generated (`npx prisma migrate dev`) once a dev Postgres is
   available."* Extend the existing note rather than duplicating it.

8. **Don't commit or push.** Leave the working tree for the orchestrator
   (human or coordinating agent) to review and commit, unless explicitly
   told otherwise.

9. **Avoid editing `docs/roadmap.md` concurrently with another running
   agent.** If you know another task is mid-flight and also touches
   `docs/roadmap.md`, either skip that file (report the checklist items
   that should be checked off, let the orchestrator do it) or make sure
   your edit targets a different section/line range than theirs.

10. **Match existing patterns over inventing new ones.** Look at how the
    nearest analogous feature was built (a similar API route, a similar
    dashboard panel, a similar block type) and follow its shape, naming,
    and file layout rather than introducing a parallel convention.

11. **Ecommerce and analytics/reporting dashboards are out of scope.**
    Don't propose or build toward them — see `docs/roadmap.md`'s
    "Explicitly out of scope" section.

12. **Security/architecture audit is deferred** until all roadmap phases
    are complete — don't launch one after an individual phase lands
    unless explicitly asked.
