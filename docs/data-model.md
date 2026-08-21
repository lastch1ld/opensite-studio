# Data Model

Prisma + Postgres. Core entities needed for full parity, with MVP subset marked.

## MVP entities `[x]`

- **User** — id, email, passwordHash (nullable if OAuth-only), name, image, role (`OWNER` default), timestamps.
- **Site** — id, ownerId → User, name, subdomain (unique, for the default `*.host` preview), customDomain (nullable, deferred activation — see deployment.md), timestamps.
- **Page** — id, siteId → Site, slug, title, draftContent (Json — block tree), publishedContent (Json, nullable until first publish), isHome (bool), timestamps.
- **Session/Account/VerificationToken** — standard NextAuth Prisma adapter tables.

## Block tree shape (stored in `draftContent`/`publishedContent`)

```ts
type Block = {
  id: string;          // stable uuid, used for editor selection + React key
  type: string;         // registry key, e.g. "section", "text", "image", "button"
  props: Record<string, unknown>; // block-specific data (text, src, href, alignment...)
  style?: Record<string, unknown>; // box model + typography overrides, see blocks-and-theming.md
  children?: Block[];
};

type PageContent = {
  root: Block;          // always a "section"/container root
  version: number;       // schema version for future migrations
};
```

## Needed for full parity `[ ]`

- **Revision** — id, pageId, content (Json snapshot), createdById, createdAt, label. Every publish (and optionally periodic autosave checkpoints) creates one → enables version history / rollback, a baseline Wix/Elementor feature.
- **Media** — id, siteId, url/storageKey, mimeType, width/height, altText, createdAt. See media.md.
- **Theme** — id, siteId, tokens (Json: color palette, font families/scale, spacing scale). Referenced by blocks' `style` instead of hardcoded values, so a theme change cascades site-wide. See blocks-and-theming.md.
- **Membership** — id, siteId, userId, role (`OWNER`/`EDITOR`/`VIEWER`). Needed once a site can have collaborators, not just a single owner. See auth.md.
- **Domain** — id, siteId, hostname, verified (bool), verificationToken. Custom-domain support beyond the single `customDomain` string, for multiple verified hosts per site.
- **FormSubmission** — id, pageId, blockId, data (Json), createdAt. Needed once a "Form" block exists (contact forms are a standard Wix/Elementor feature).
- **Plugin/Installation** — see plugins-and-extensibility.md.
- **Component/SavedBlock** — id, siteId, name, content (Json Block subtree). User-saved reusable blocks/symbols (Wix's "saved components", Elementor's "global widgets").

## Migration strategy

`PageContent.version` exists from day one so block-shape changes can be
migrated lazily on read (transform old JSON → new JSON) rather than requiring
a hard cutover across every stored page.
