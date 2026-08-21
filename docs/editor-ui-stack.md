# Editor UI Stack

Scope: the editor's own **chrome** — toolbar, layers panel, inspector,
modals (media picker, version history), viewport/breakpoint toggle. Not the
block-rendering/canvas system (`BlockRenderer` + `blockRegistry`), which is
covered by [architecture.md](architecture.md) and
[blocks-and-theming.md](blocks-and-theming.md) and is out of scope for the
choices below — none of them may sit between the editor canvas and the
public renderer.

## Current state

- **Tailwind v4 is already installed and in use** (`@tailwindcss/postcss`,
  `app/globals.css` imports it) — `apps/web/package.json` and every editor
  component (`Toolbar.tsx`, `Inspector.tsx`, `LayersPanel.tsx`,
  `VersionHistoryPanel.tsx`, `MediaPicker.tsx`) already use Tailwind utility
  classes (`rounded border px-3 py-1 text-sm`, etc.). It came from
  `create-next-app`'s default template, not a deliberate design-system
  decision, but it's there and working — this doc is about what to layer on
  top of it, not whether to add it.
- **No component library** — no Radix, no shadcn/ui, no Headless UI. Every
  interactive element (dropdown-less button groups, the History/MediaPicker
  modals) is hand-rolled: e.g. `VersionHistoryPanel.tsx` and
  `MediaPicker.tsx` implement a modal as `fixed inset-0 bg-black/40` +
  `onClick` backdrop-close, with no focus trap, no `Escape` handling, no
  `aria-modal`, and no portal — real gaps, not hypothetical ones.
  `Inspector.tsx`'s `<select>` for token overrides is a native select, not a
  styled listbox.
- **Custom drag-and-drop**, not a page-builder framework: `@dnd-kit/core`
  only (`DndContext`, `useDraggable` in `dnd/PaletteItem.tsx`,
  `DragHandleWrapper.tsx`, `DropSlotList.tsx`) — `@dnd-kit/sortable` was a
  deliberate non-choice, the reorder/reparent math is done by hand against
  the block tree (`lib/blockTree.ts`: `addBlockAt`, `moveBlock`).
- **Custom block-tree state + history**: `lib/useHistory.ts` (undo/redo
  stack) drives `EditorClient.tsx`'s `content` state; there is no external
  state/history library.
- **The one architectural constraint everything below must respect**:
  `BlockRenderer.tsx` is called identically by the editor canvas and the
  public renderer — editor-only behavior is injected via two optional
  callback props (`renderNodeWrapper`, `renderChildrenWrapper`), not by
  swapping the renderer. Anything that would need to *own* canvas rendering
  breaks this.

## Tailwind + Radix Primitives (direct, not shadcn) — `[x]` recommended

**Verdict: yes**, adopt `@radix-ui/react-*` primitives directly, styled with
the Tailwind already installed. Do not add shadcn/ui.

What Radix Primitives actually are, checked against their docs rather than
assumed: unstyled behavior-only components (focus management, roving
tabindex, `aria-*` wiring, portal + collision-aware positioning,
Escape/outside-click dismissal) shipped as one npm package per primitive
(`@radix-ui/react-dialog`, `-dropdown-menu`, `-tabs`, `-popover`, `-select`,
`-toggle-group`, `-tooltip`, ...). They render zero default CSS — you own
every class. shadcn/ui is a different layer on top: a CLI that copies
pre-styled Radix-wrapping component source into your repo, with Tailwind
classes already chosen (rounded-md corners, card/shadow treatment, a
particular spacing and type scale) tuned for typical SaaS app UI — dashboard
forms, settings pages, marketing-adjacent product chrome.

This project's editor chrome is a dense, tool-like surface (closer to
Figma/Webflow's own UI than to a SaaS dashboard): small hit targets packed
into a 220px layers rail and a 280px inspector rail, icon-only toggles,
compact form controls repeated per block-field. shadcn's defaults (larger
touch-friendly spacing, card-style grouping, `text-sm`/`rounded-md`-as-a-
default visual identity) fight that density rather than support it, and
"copy-paste then override every className" is more edit surface than
"write the classNames directly against unstyled primitives" for a UI this
constrained. Going directly to Radix costs nothing in capability — same
accessibility/behavior guarantees — for less styling to unwind.

Concrete fit against what's already broken today:
- `MediaPicker`/`VersionHistoryPanel` → `@radix-ui/react-dialog` (focus
  trap, Escape, `aria-modal`, portal — all currently missing).
- Breakpoint toggle in `Toolbar.tsx` (currently a manual `.map()` of
  `<button>`s with manual active-class logic) → `@radix-ui/react-toggle-group`.
- Token-override `<select>` in `Inspector.tsx` → `@radix-ui/react-select`
  (or leave native — low priority, native select is functionally fine here).
- Any future right-click / overflow menu on layers-tree nodes →
  `@radix-ui/react-dropdown-menu`.

```ts
// sketch: dialog wrapper other editor modals can share
import * as Dialog from "@radix-ui/react-dialog";

function EditorModal({ title, children, onClose }: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[560px] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded bg-white p-4 shadow-lg">
          <Dialog.Title className="text-sm font-semibold">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

Adopt incrementally — swap one component at a time (start with the two
modals), not a big-bang chrome rewrite.

## Puck / Craft.js — `[ ]` not recommended

**Verdict: no**, for either. Researched both against this project's core
constraint (one render codepath shared by editor canvas and public
renderer):

- **Puck** (`measuredco/puck`, MIT, actively maintained, npm `@measured/puck`):
  ships its own canvas (an iframe-rendered drop zone), its own component
  registry (`config.components`, each with a `render` + `fields`), and its
  own drag-and-drop (its own engine, not dnd-kit). Puck *can* render the
  same `config` server-side outside the editor via `<Render config data />`,
  which is the closest either project comes to "shared codepath" — but that
  means replacing `BlockRenderer`/`blockRegistry` with Puck's config format
  and `<Render>` as the public renderer too, i.e. a rewrite of the block
  system end to end (types, `lib/bind.ts`, `lib/condition.ts`,
  `lib/responsiveStyle.ts` token/breakpoint resolution, the `list`-block
  repeater logic in `BlockRenderer.tsx` all assume this project's own
  `Block`/`RenderContext` shapes), not an addition alongside it.
- **Craft.js** (`prevwong/craft.js`, MIT, low recent commit velocity —
  treat as lightly maintained): a lower-level toolkit (`useNode`,
  `useEditor`, its own `Frame`/`Element` tree) for *building* a page-builder
  editor, not a drop-in one. It has no built-in public/production renderer
  at all — Craft.js's `Frame` is editor-only; you'd still hand-write a
  separate render path for the published site, which directly reintroduces
  the "naive CMS+templating split" architecture.md calls out as the thing
  this project is explicitly avoiding.

Neither can be adopted narrowly (e.g. "just use Puck for the layers panel")
— both are frameworks that own the whole canvas + state + DnD stack as one
unit; there's no seam to take just a widget from them. Given this project
already has a working, purpose-built canvas/registry/history/dnd-kit stack
that satisfies the shared-codepath rule today, swapping to either would be a
rewrite in exchange for tooling this project already has, with Craft.js
additionally regressing the shared-renderer guarantee. Not worth it now or
later unless the custom stack hits a wall neither of these actually solves
better.

## lucide-react — `[x]` recommended

**Verdict: yes.** Plain React icon components (tree-shakeable, one import
per icon: `import { Trash2 } from "lucide-react"`), no runtime CSS
dependency, so it doesn't interact with the Tailwind/Radix decision above
either way. MIT-licensed, actively maintained, and — unlike an icon font —
each icon is inline SVG, so `stroke`/`size` are just props, no special
build config. No conflicts found with the current Next.js 16 / React 19
setup. Bundle-size risk is negligible as long as icons are imported
individually (`lucide-react` is already structured for this — no barrel
"import the whole set" trap). Straightforward add whenever editor icons are
next touched (undo/redo, viewport toggle, layers-tree type icons, delete);
no need to block on anything else in this doc.

## Explicitly out of scope

- Adopting shadcn/ui's copy-pasted component source (see verdict above —
  direct Radix instead).
- Any change to `BlockRenderer.tsx`/`blockRegistry`/the public renderer as
  part of this doc — those are untouched by every recommendation here.
- Switching the drag-and-drop engine away from `@dnd-kit/core` — Puck's and
  Craft.js's DnD engines were evaluated only as part of "adopt the whole
  framework," not as standalone reorder libraries; there's no proposal here
  to swap dnd-kit out on its own.
- A full chrome visual redesign — this doc scopes *tooling* (Radix
  primitives, icons), not a new visual language for the editor.
