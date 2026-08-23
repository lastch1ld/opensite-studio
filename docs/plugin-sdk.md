# Plugin & Block SDK

Implementation reference for [plugins-and-extensibility.md](plugins-and-extensibility.md)'s
design sketch. That doc says *what* and *why*; this one documents the
actual API surface, manifest schema, install flow, and trust model as
built — read it before writing a plugin or touching the block registry.

## Workspace layout

Package extraction was explicitly deferred in
[architecture.md](architecture.md) "until there's a second consumer" — a
plugin is that second consumer, so this is the one place in the repo a
`packages/` split is sanctioned. The repo root gained an npm workspaces
`package.json` (`"workspaces": ["apps/*", "packages/*"]`):

```
opensite-studio/
├── apps/
│   └── web/                      # unchanged app, now a workspace member
├── packages/
│   ├── block-sdk/                # registerBlock() + block types
│   └── plugin-api/                # plugin manifest schema + PluginApiClient
├── plugins/
│   └── example-plugin/           # reference plugin (see below)
└── package.json                  # workspaces root
```

Both packages ship raw TypeScript with no build step (`main`/`types`
point straight at `src/index.ts`); `apps/web/next.config.ts` lists them
under `transpilePackages` so Next's own build compiles them, same as any
other source in the app. Each package has its own `tsconfig.json` so
`npx tsc --noEmit` works standalone inside it.

## `@opensite/block-sdk`

The extracted registration mechanism from
`apps/web/components/blocks/registry.tsx` — the *types* and the
*registerBlock/lookup functions*, not the built-in blocks themselves.
Built-in blocks (section, text, image, button, heading, spacer, columns,
embed, list, form, newsletter) still live in and get registered from
`apps/web/components/blocks/registry.tsx`, on top of this package.

### `registerBlock`

```ts
import { registerBlock } from "@opensite/block-sdk";

registerBlock({
  type: "my-plugin/callout",       // unique, namespaced (see below)
  label: "Callout",                 // palette button + Inspector heading
  defaultProps: { text: "Hello", tone: "info" },
  defaultStyle: {},                 // optional; seeds a new block's style.base
  inspector: [
    { key: "text", label: "Text", group: "props", input: "textarea" },
    {
      key: "tone",
      label: "Tone",
      group: "props",
      input: "select",
      options: [
        { label: "Info", value: "info" },
        { label: "Warning", value: "warning" },
      ],
    },
  ],
  render(props, style, children, meta) {
    // return a ReactNode. `children` is already-rendered content for
    // container blocks; `meta.blockId` and `meta.ctx` mirror what
    // apps/web's own blocks receive (see BlockRenderMeta below).
  },
});
```

Full type (from `packages/block-sdk/src/types.ts`):

```ts
type FieldSchema = {
  key: string;
  label: string;
  group: "props" | "style";
  input: "text" | "textarea" | "number" | "color" | "select" | "url" | "image" | "collectionSelect";
  options?: { label: string; value: string }[];
  bindable?: boolean;                                    // props fields only
  tokenCategory?: "colors" | "typography" | "spacing";    // style fields only
};

type BlockRenderMeta<TCtx = unknown> = { blockId: string; ctx: TCtx };

type BlockDefinition<TCtx = unknown> = {
  type: string;
  label: string;
  defaultProps: Record<string, unknown>;
  defaultStyle?: Record<string, unknown>;
  inspector: FieldSchema[];
  render: (
    props: Record<string, unknown>,
    style: Record<string, unknown>,
    children: ReactNode,
    meta: BlockRenderMeta<TCtx>,
  ) => ReactNode;
};

function registerBlock<TCtx = unknown>(definition: BlockDefinition<TCtx>): void;
function getBlockDefinition<TCtx = unknown>(type: string): BlockDefinition<TCtx> | undefined;
function getAllBlockDefinitions<TCtx = unknown>(): BlockDefinition<TCtx>[];
```

**Design decisions beyond the doc's sketch** (`registerBlock({ type, render,
inspector, defaultProps })` was a minimal sketch, not a full spec):

- `label` and `defaultStyle` are part of the real signature, not an
  undocumented extension — `label` drives the palette button and
  Inspector heading, `defaultStyle` seeds a new instance's `style.base`
  (`createBlock` in `apps/web/components/blocks/registry.tsx`). Both are
  load-bearing in the actual editor, so leaving them out of the typed API
  would just push the same fields into an untyped side channel.
- The registry is a **module-level singleton per process** (a plain
  `Map`), not per-request state — the same instance is populated once by
  apps/web's built-ins and once by whatever plugins `loadPlugins()` finds,
  and both editor and public renderer read from it. This mirrors the
  "one resolve function, called from both sides" pattern AGENTS.md
  already uses for `$token`/`$bind`/`Condition`.
- Re-registering an already-used `type` **overwrites and logs a warning**
  instead of throwing. A self-hosted app shouldn't hard-crash over one
  plugin reusing a type string; namespace your block types
  (`your-plugin-name/block-name`, see the example plugin) so this never
  happens by accident.
- `Block` (the recursive block-tree node — id/type/props/style/children/
  **condition**) stays defined in `apps/web/components/blocks/types.ts`,
  not in the SDK. Its `condition` field uses opensite-studio's `Condition`
  engine (AGENTS.md glossary), which is an app concept a generic block
  registry has no reason to know about. What the SDK exports is exactly
  what `registerBlock` needs: `FieldSchema`, `BlockStyle`, `Breakpoint`,
  `BlockRenderMeta`, `BlockDefinition`. `apps/web/components/blocks/
  types.ts` re-exports `FieldSchema`/`BlockStyle`/`Breakpoint` from the
  SDK so nothing is duplicated.
- `Block.type` (and the SDK's `BlockDefinition.type`) is plain `string`,
  not a closed union — `apps/web/components/blocks/types.ts` keeps
  `BuiltinBlockType` as a reference union of the built-in types, but
  nothing in the block tree or registry is restricted to it, since
  plugins need to add arbitrary new type strings at runtime.

## `@opensite/plugin-api`

Two independent pieces:

### Plugin manifest (`plugin.json`)

```json
{
  "name": "example-plugin",
  "version": "0.1.0",
  "description": "Reference plugin for opensite-studio's Block SDK.",
  "main": "./index.mjs",
  "permissions": ["adds:block"]
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | kebab-case, unique; also used to namespace block types |
| `version` | yes | semver string; informational only, no compatibility checks performed |
| `description` | no | free text |
| `main` | yes | path to the entry module, relative to the plugin's own directory |
| `permissions` | yes (can be `[]`) | declared-intent list, see below |

`validatePluginManifest` (called by the loader for every plugin found)
refuses to load a plugin whose `plugin.json` is missing, isn't valid JSON,
is missing a required field, or requests a permission outside the known
vocabulary — this is the sandboxing doc's item (a), "manifest validation
that refuses to load a plugin whose plugin.json is malformed or missing
required fields." A rejected plugin is skipped (logged, doesn't crash the
server) — see "Install flow" below.

### Permission vocabulary

Deliberately small and concrete — a self-hoster reads this list before
deciding to trust a plugin, it does not gate anything at runtime in this
pass (see "Trust model" below):

| Permission | Meaning |
|---|---|
| `adds:block` | registers one or more blocks via `registerBlock` |
| `adds:apiRoute` | reserved for a future plugin-owned API route — nothing implements this yet; declaring it just documents intent |
| `reads:siteSettings` | read-only access to a Site's public settings via `PluginApiClient` |
| `reads:theme` | read-only access to a Site's Theme tokens via `PluginApiClient` |
| `reads:collections` | read-only access to a Site's Collection items via `PluginApiClient` |

### `PluginApiClient`

```ts
abstract class PluginApiClient {
  constructor(pluginName: string, grantedPermissions: readonly PluginPermission[]);
  getSiteSettings(siteId: string): Promise<{ siteId: string; name: string } | null>;
  getTheme(siteId: string): Promise<{ tokens: Record<string, unknown> } | null>;
  getCollectionItems(siteId: string, collectionId: string): Promise<{ id: string; data: Record<string, unknown> }[]>;
}
```

`apps/web/lib/plugins/pluginApiClient.ts` supplies the concrete,
Prisma-backed implementation (`DbPluginApiClient`), scoped per-plugin to
whatever permissions its manifest declared — each method calls
`requirePermission(...)` first and throws `PluginPermissionError` if the
plugin didn't declare it.

Today's only plugin (the example) is block-only and never touches this
client — it's established now, ahead of any real caller, specifically so
a future plugin author reaching for site data has an obvious restricted
path (`import { PluginApiClient } ...`) instead of the obvious wrong one
(`import { db } from "@/lib/db"` straight from plugin code). The loader
constructs a `DbPluginApiClient` for every plugin and passes it to an
optional `activate(api)` export, if the plugin has one — see "Writing a
plugin" below.

## Install flow

Self-hosted model per plugins-and-extensibility.md: **drop a package in
`/plugins`, then restart** — not a hosted marketplace, no in-app install
UI. Concretely:

1. Create `/plugins/<your-plugin-name>/` at the repo root (sibling to
   `/apps`), containing `plugin.json` and whatever entry module `main`
   points to.
2. Restart the server. `apps/web/instrumentation.ts` — Next.js's
   supported app-startup hook — calls `loadPlugins()`
   (`apps/web/lib/plugins/loadPlugins.ts`) once, before any request is
   handled. It scans `/plugins`, validates each subdirectory's
   `plugin.json`, dynamically imports its `main`, and calls
   `registerBlock` (via `@opensite/block-sdk`) for every entry in the
   module's exported `blocks` array.
3. That's it — no hot reload, no rebuild step for the *server* (see the
   client-bundle caveat below for the one case that does need a rebuild).
   A plugin that fails to load (bad manifest, throwing entry module, etc.)
   is logged (`console.error`) and skipped; it never takes the rest of
   the app down.

`PLUGINS_DIR` (env var, see `.env.example`) overrides the default
location if your deployment's layout doesn't put `/plugins` two
directories above `apps/web`'s working directory. The bundled
`docker-compose.yml` bind-mounts `./plugins:/app/plugins` on the `web`
service specifically so dropping a plugin on the host and running
`docker compose restart web` works without rebuilding the image.

### Writing a plugin

See `/plugins/example-plugin/` for a complete, working reference — copy
it as a starting point. Its `plugin.json`:

```json
{
  "name": "example-plugin",
  "version": "0.1.0",
  "description": "Reference plugin for opensite-studio's Block SDK — registers one custom 'Callout' block. Copy this directory as a starting point for your own plugin.",
  "main": "./index.mjs",
  "permissions": ["adds:block"]
}
```

And its entry module (`index.mjs`, trimmed):

```js
import React from "react";

export const blocks = [
  {
    type: "example-plugin/callout",
    label: "Callout (Example Plugin)",
    defaultProps: { text: "...", tone: "info" },
    defaultStyle: {},
    inspector: [/* FieldSchema entries */],
    render(props) {
      return React.createElement("div", { style: { /* ... */ } }, props.text);
    },
  },
];
```

Two constraints that follow directly from how the loader imports this
file, both worth calling out explicitly since they're easy to miss:

- **Plain, already-runnable JavaScript only.** The entry module is loaded
  by a real, unbundled `import()` at server runtime (see "Editor canvas
  vs. public renderer" below for why) — it never passes through Next's
  webpack/Turbopack/Babel pipeline. No JSX, no bare TypeScript syntax.
  Use `React.createElement` (as the example does) or compile your
  TS/JSX plugin source to plain JS first and point `main` at the
  compiled output.
- **Namespace your block `type`s** as `<plugin-name>/<block-name>` (the
  example uses `example-plugin/callout`). `registerBlock` allows
  re-registration (it overwrites and warns, it doesn't throw — see
  `@opensite/block-sdk` above), so an unnamespaced type is a real,
  silent collision risk against built-ins or another installed plugin.

An entry module may also export an `activate(api)` function
(`api: PluginApiClient`, permission-scoped to that plugin's manifest) —
called once at load time, after that plugin's blocks are registered.
Reserved for future server-side plugin logic; the example plugin doesn't
need it and doesn't implement it.

### Editor canvas vs. public renderer — a real limitation, not glossed over

`loadPlugins()` runs server-side only (`apps/web/instrumentation.ts` is
gated on `NEXT_RUNTIME === "nodejs"`), scanning the filesystem and
dynamically importing a path that's only known at server runtime. This
means:

- The **public renderer** (`app/(public)/**`, `app/site/**`) is
  server-rendered per request in the same long-running Node process that
  called `loadPlugins()` at startup, so it sees plugin blocks correctly —
  this is what the example plugin demonstrates end to end.
- The **editor canvas** (`/edit/[siteId]/[pageId]`) is a `"use client"`
  React tree, compiled into a static JS bundle by `next build` *ahead of
  time*. A path only known at server runtime can never be included in
  that pre-built bundle — this isn't a gap in this implementation, it's
  a hard constraint of shipping a bundled SPA-style editor. In this pass,
  a plugin's block will **not** appear in the editor's palette or render
  on the editor canvas after a server restart alone; making that work
  would mean giving every plugin its own separately-served client bundle
  (WordPress-Gutenberg-style), which is real, separate scope, not a
  "restart the server" feature.

Stated plainly so it isn't misrepresented later: **"drop a plugin +
restart" fully works for what gets published; it does not (yet) make
that plugin's block editable in the live canvas without also rebuilding
the app.** If/when the editor side matters enough to build, it's a
follow-up to this doc, not an extension of `loadPlugins()`.

## Sandboxing / trust model

Full V8-isolate-style sandboxing of arbitrary third-party Node code is a
large, separate effort and explicitly out of scope for this pass (per
plugins-and-extensibility.md). What's actually built:

- **Manifest validation** refuses to load a plugin with a malformed or
  incomplete `plugin.json`, or one requesting an unknown permission (see
  "Plugin manifest" above).
- **`PluginApiClient`** gives plugin authors a documented, narrower
  *default* surface than the raw Prisma client, with permission checks
  enforced at each method call for any plugin that uses it as intended.

**What this is not:** plugins are trusted local code a self-hoster
deliberately installs by dropping a directory under `/plugins` — the
same trust level as adding an npm dependency to `package.json`, **not**
sandboxed untrusted code. A plugin's entry module runs as plain Node.js
code in the same process as the host app. Nothing stops a plugin from
`require("@prisma/client")` directly, reading environment variables
(including `SECRETS_ENCRYPTION_KEY`, `NEXTAUTH_SECRET`, etc.), or making
arbitrary outbound network calls — the declared `permissions` list in
`plugin.json` is read by a human before they install a plugin and
double-checked by `validatePluginManifest` for shape, but it is **not**
an enforced sandbox boundary. Do not describe this to end users as
protection against a malicious plugin author; it protects against
manifest typos and gives good-faith plugin authors an obvious restricted
API to reach for, nothing more.

## Out of scope (unchanged from plugins-and-extensibility.md)

Marketplace/discovery — a hosted registry of community plugins — is not
built and not planned for this pass, per the original doc: "only
relevant if/when there's a registry of community plugins."
