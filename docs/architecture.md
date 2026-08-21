# Architecture

## Goal

A single self-hostable app that lets a logged-in user create one or more
"Sites", visually edit their Pages with a drag-and-drop block editor, and
publish them to be served publicly — without a page-reload round trip through
a separate site generator (i.e. Wix/Elementor-style live editing, not a
static-site-build workflow).

## High-level components

```
opensite-studio/
├── apps/
│   └── web/                # single Next.js app (App Router)
│       ├── app/
│       │   ├── (marketing)/        # optional landing/login pages for the CMS itself
│       │   ├── (dashboard)/        # authenticated app: site list, settings, media
│       │   ├── (editor)/edit/[siteId]/[pageId]/  # the live visual editor
│       │   ├── (public)/[[...slug]]/              # public renderer for published pages
│       │   └── api/                # route handlers: auth, pages, blocks, media, publish
│       ├── components/
│       │   ├── editor/             # canvas, toolbar, layers panel, inspector
│       │   ├── blocks/             # block registry + renderers (see blocks-and-theming.md)
│       │   └── ui/                 # shared design-system primitives for the app chrome itself
│       ├── lib/
│       │   ├── auth.ts             # NextAuth config
│       │   ├── db.ts               # Prisma client
│       │   └── permissions.ts      # role/ownership checks
│       └── prisma/
│           └── schema.prisma
├── packages/                       # extracted only once something is reused outside apps/web
├── docs/
└── docker-compose.yml
```

A packages/ workspace split (editor-core, block-sdk, renderer as standalone
libs) is deferred until there's a second consumer (e.g. a plugin SDK or a
headless-only deployment) — see [plugins-and-extensibility.md](plugins-and-extensibility.md).
Premature package extraction is explicitly out of scope for the MVP.

## Data flow

1. **Authoring**: editor UI holds the current page's block tree in client
   state (React), mutates it via block registry actions (add/move/edit
   props), and autosaves the tree as JSON to `Page.draftContent` via an API
   route. This is the "live" part — no rebuild step.
2. **Publishing**: an explicit "Publish" action copies `draftContent` →
   `publishedContent` (+ creates a `Revision` snapshot). Public renderer only
   ever reads `publishedContent`.
3. **Rendering**: the public route resolves `host + path` → `Site` + `Page`,
   reads `publishedContent` (JSON block tree), and renders it server-side
   with the same block renderers the editor uses in "preview" mode — one
   block-rendering codepath shared between editor canvas and public site,
   so what you see while editing is what ships.

## Why this shape

- One Next.js app (not separate editor/renderer services) keeps the MVP
  deployable as a single container and avoids premature service
  boundaries — see [deployment.md](deployment.md).
- Shared block renderers between editor and public site is the core
  guarantee that makes "live visual editing" trustworthy; it's the thing
  Wix/Elementor get right and a naive CMS+templating split gets wrong.
- JSON block tree (not HTML strings) as the source of truth is what makes
  the editor structurally editable (select/move/nest blocks) rather than
  just a rich-text blob.
