# Content Import (Sitemap Import & Content Clipboard)

Not part of Phase 0/1. Two related one-time migration tools for bringing an
existing (non-OpenSite-Studio) website into a new Site here: **sitemap
import** creates empty Page structure from a site's URL list, and the
**content clipboard** helps a user manually move an old page's text into new
blocks. Neither is an ongoing sync — see "One-time, not sync" below.

This is distinct from starter-templates.md, which is the reverse direction:
starter-templates.md ports one specific known codebase (`blog-template`/
Aperture) into this project's block library as reusable starter blocks,
authored once by us. This doc is a generic tool, exposed to every user, for
pointing at *any* old site they personally own/run and pulling its
structure/content into a fresh Site — no foreknowledge of the source site's
code or markup required.

## Feature 1: Sitemap import (page structure)

### Input

- A `sitemap.xml` URL, or an uploaded sitemap file (same parser either way).
- Fallback when no sitemap is found/reachable: crawl from a given root URL,
  following same-origin `<a href>` links up to a depth/count limit. Lower
  quality (no guarantee of coverage) but avoids a hard dead end — flagged in
  the import UI as "crawled, not from sitemap" so the user knows the result
  may be incomplete.

### What it creates

Parses the URL list into paths, strips the origin, and groups by path
segment. Each unique path becomes an empty `Page`:

```ts
type SitemapImportResult = {
  pages: Array<{
    suggestedSlug: string;   // from the URL path, e.g. "about/team"
    suggestedTitle: string;  // humanized last segment, e.g. "Team"
    sourceUrl: string;       // original absolute URL, kept for Feature 2 hand-off
    depth: number;           // path segment count, for the tree UI
  }>;
};
```

- `/` (or the shortest path) → the `isHome` Page.
- `/about` and `/about/team` → two Pages, titles guessed from the last path
  segment (`about` → "About", `team` → "Team"), with `about/team` implying
  `about` exists as an ancestor in the tree even if no URL for it appears in
  the sitemap on its own (synthesize an empty "About" page shell in that
  case, same as any other entry).
- Every created Page gets an empty `draftContent` (a bare `root` section
  block, matching `PageContent`'s shape in data-model.md) and nothing in
  `publishedContent`. No block content is populated — that's Feature 2,
  invoked separately per page afterward.

### Page hierarchy: decision

data-model.md's `Page` has a flat `slug` with no parent/child relation, and
renderer.md's catch-all route already resolves multi-segment slugs (a
`Page.slug` of `about/team` matches `/about/team` directly, no tree walk
needed at render time). **Decision: add `Page.parentId` (nullable,
self-relation) rather than relying on slug segments alone.**

Reasoning:
- The renderer never needs it — path matching stays exactly as documented in
  renderer.md, unaffected by this doc.
- The dashboard's page-tree UI and any future navigation-menu-block
  ("auto" mode, listing a page's children) do need it, and deriving a tree
  from string-splitting `slug` is fragile: it silently breaks the moment a
  page is renamed to a slug that no longer nests under its logical parent's
  slug (e.g. renaming `about` to `company` should not force every child page
  to also become `company/...`, but slug-derived hierarchy has no other way
  to express "team is still a child of the About page"). An explicit
  `parentId` keeps hierarchy and URL independent, which is also how
  Wix/Elementor-class tools actually behave (moving a page in the site
  structure doesn't necessarily rewrite its URL).
- It's a small, additive column (nullable FK to `Page.id`) — doesn't block
  or complicate the MVP `Page` shape, and sitemap import is the natural
  first writer of it: `about/team`'s inferred parent is whichever created
  Page has `suggestedSlug: "about"`.
- `slug` remains the single source of truth for the URL the renderer
  resolves; `parentId` is purely a page-tree/navigation organizational field
  and is not inferred from at render time. Manually-created pages (not
  through sitemap import) simply leave `parentId` null (flat, top-level) —
  no migration burden on existing Pages.

### Import UI

Lives in the dashboard, under a Site's page-management area (alongside
wherever pages are listed/created — see editor.md's dashboard shell), as an
"Import pages from existing site" action next to "New page". Presents the
parsed structure as a checkable tree before creating anything (same
review-before-commit shape as Feature 2's clipboard, not a blind bulk
insert).

### Slug collisions

If a suggested slug already exists on the Site (re-running import, or a page
was hand-created first), that entry is flagged in the review tree and
skipped by default rather than overwritten — importing must never clobber
existing `draftContent`. The user can choose to still create it under a
disambiguated slug (`about-2`) if they explicitly want a duplicate.

### One-time, not sync

Sitemap import is a single explicit dashboard action that runs once per
invocation and stops — there is no stored link back to the source sitemap,
no scheduled re-crawl, and no "refresh from source" button. Re-running it
later is just running the same one-time action again (subject to the
collision handling above), not an update to a prior import.

## Feature 2: Content clipboard (page text migration)

### Workflow

1. In the editor (editor.md), the user opens the content clipboard panel and
   pastes an old page's URL (typically the `sourceUrl` carried over from a
   Feature 1 import, but works standalone too).
2. The server fetches that URL's HTML and extracts content fragments (see
   below), staging them in the clipboard panel. Nothing is written to the
   page yet.
3. The user selects a block on the canvas as normal, opens the clipboard
   panel, and clicks a staged fragment to insert its text into that block's
   `props`, replacing/populating the block's content.

This is manual, block-by-block, on purpose — see "Explicitly out of scope"
below for why full auto-mapping isn't part of v1.

### Extraction approach

Fetch the page HTML server-side, then reduce it to a flat list of semantic
fragments — no visual/layout information survives extraction:

```ts
type ContentFragment = {
  id: string;
  semanticType: "heading" | "paragraph" | "listItem" | "quote" | "caption";
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6; // only for "heading"
  text: string;        // plain text, or...
  html?: string;        // ...minimal inline HTML, only <b>/<strong>/<i>/<em>/<a href>
  sourceSection?: string; // best-effort grouping label, e.g. nearest <section>/<article> id or heading text, for panel display only
};
```

- Walk the parsed DOM (e.g. via a server-side HTML parser) over
  block-level semantic elements (`h1–h6`, `p`, `li`, `blockquote`, `figcaption`)
  and boilerplate-filter obvious chrome (`nav`, `header`, `footer`, script/
  style content, elements with common cookie-banner/ad-slot markers) — a
  best-effort content-vs-chrome heuristic, not a guarantee; the panel is a
  human review step precisely because this won't be perfect.
- Inside each fragment, strip everything presentational (inline `style`,
  `class`, `font`, `span` wrappers, layout containers) and keep only
  semantically meaningful inline marks: bold/italic emphasis and links.
  Everything else in the source markup — font-size, color, spacing, `div`
  soup — is discarded at extraction time, not just ignored at insert time.
- `sourceSection` is purely a UI grouping label in the clipboard panel
  ("fragments found near the Team heading") — it has no effect on where or
  how a fragment can be inserted; any fragment can go into any compatible
  block.

### Formatting: target block wins

When a fragment is inserted into a block, the block's own `style` (or the
Theme, once blocks-and-theming.md's theme tokens exist) determines
font-size/color/weight/spacing — never the source page's. Concretely: insert
writes the fragment's `text`/`html` into the target block's text `props`
field only, and never touches the target block's `style`. A fragment tagged
`heading` inserted into a `text` block (blocks-and-theming.md's MVP block
set has no dedicated `heading` block yet) still renders with that `text`
block's configured style — the `headingLevel`/`semanticType` tag is
informational (helps the user pick a *sized-appropriately* target block in
the panel, e.g. hinting "this looks like an H2") but is not itself applied
as styling.

The only thing that carries over from source to destination is the
`html` inline-mark subset (bold/italic/links) — because those are content
semantics (this word is emphasized, this phrase is a link), not visual
styling, matching how `text` blocks already support inline marks per
blocks-and-theming.md/forms.md's precedent of storing minimal rich content
rather than raw HTML blobs.

### Where staged fragments live

**Decision: an in-memory, session-scoped store (server-side, keyed by the
editor session/page), not a database table.**

Reasoning:
- Staged fragments are disposable working state, not site content — once a
  fragment is inserted, its text now lives in `Page.draftContent` like any
  other block edit (and is autosaved/versioned through the exact same path
  as all editor changes); once the user is done importing for a page, the
  clipboard's contents have no further value.
- A DB table would need its own lifecycle (cleanup job for abandoned staged
  fragments, ownership/site-scoping, migration) for something that's
  correct to lose on server restart or session end — unlike
  `FormSubmission` (data-model.md), which is durable user data that must
  survive.
- Re-fetching a source URL is cheap and idempotent (no dedup/versioning
  concern the way stored content would have), so "just re-run the fetch" is
  an acceptable recovery path if the session store is lost — this doesn't
  hold for something like `Revision`, which is why that one *is* a DB table.
- If cross-session persistence turns out to matter in practice (e.g. staging
  fragments for a page the user comes back to tomorrow), the escape hatch is
  a small `ImportSession` table later — not a redesign of the fragment shape
  above, since `ContentFragment` already serializes cleanly to JSON.

Concretely: an API route fetches + extracts on request and returns the
fragment list to the client, which holds it in the editor's client-side
state (parallel to how the block tree itself is held client-side per
architecture.md) for the duration of the editing session; re-opening the
editor later means re-fetching the source URL again, not restoring a saved
staging area.

### Clipboard panel placement

Editor.md's layout is canvas (center) + layers tree (left) + inspector
(right). The content clipboard is a **third right-side panel, tabbed
alongside the inspector** (not a fourth persistent column, to avoid
crowding the canvas) — "Inspector" and "Import" tabs over the same right
rail. This keeps the panel visible while a block is selected (the common
case: select a block, flip to the Import tab, click a fragment, flip back)
without permanently narrowing the canvas for users who aren't mid-import.

Within the panel: a URL input + "Fetch" action at the top, then the
extracted fragments listed grouped by `sourceSection`, each with a compact
type badge (H2, P, list item, etc.) and truncated text preview; clicking a
fragment inserts into whichever block is currently selected on canvas
(disabled/hinted state if nothing is selected, or if the selected block
isn't a text-bearing block type).

### Explicitly out of scope

- **Automatic content-to-block mapping** (AI-matching fragments to the
  "right" block on the page and inserting all of them at once) is not part
  of v1. The clipboard's whole design — stage, review, manual click-to-
  insert — exists because reliable automatic mapping (matching a fragment's
  semantic role and position to the *correct* corresponding block in a
  newly-built, structurally different page) is a hard, error-prone problem
  on its own; doing it wrong silently (wrong text in wrong block) is worse
  than doing it manually. A possible future enhancement once the manual
  flow has proven the extraction quality, not something this doc designs.
- **Ongoing sync back to the source URL.** A fragment is a one-time snapshot
  of the source page at fetch time; there's no mechanism that re-fetches
  and updates already-inserted content, matching the "one-time, not sync"
  framing for Feature 1 above.
- **Extracting non-text content** (images, embeds, videos) from the source
  page. The clipboard is text-fragment-only in v1; image migration is
  media.md's concern, not this doc's, if it's ever built.
- **Preserving source page layout/structure** beyond the section grouping
  label — this is explicitly a flat list of reusable text fragments, not an
  attempt to reconstruct the old page's block tree.
