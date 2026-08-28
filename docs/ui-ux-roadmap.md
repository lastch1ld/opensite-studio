# UI/UX Roadmap

Every functional phase in [roadmap.md](roadmap.md) (0–4) is complete. This
doc is the next roadmap: OpenSite Studio works end-to-end but looks like
unstyled HTML forms throughout the dashboard/editor, and a brand-new Site
starts from a completely blank page with no visual starting point. Neither
blocks a self-hoster from using the product; both make it a much harder
sell to hand off to the non-technical EDITOR persona (see
[apps/web/PRODUCT.md](../apps/web/PRODUCT.md)) that's the actual point of
a Wix/Elementor alternative.

Two surfaces, two different design modes (see PRODUCT.md's Operating
Context) — they get separate phases below because they have different
goals, audiences, and even different visual worlds:

- **Product chrome** (dashboard + editor): an **Operate** surface. The
  visitor is doing a task; scanability and density beat expression. This
  is OpenSite Studio's own UI.
- **Default page templates + theme presets**: a **Persuade** surface. A
  new Site's first page needs to look like a real business's homepage, not
  a wireframe — this is content a site owner ships to *their* visitors.

## Phase A — Product chrome: real visual design system

Currently: native unstyled `<input>`/`<select>`/`<button>` elements, no
consistent spacing/type scale, no color system beyond black-on-white,
hand-rolled modals with real accessibility gaps (no focus trap, no
`Escape` handling, no `aria-modal` — see
[editor-ui-stack.md](editor-ui-stack.md), which already scoped the tooling
decision: Tailwind (already installed) + Radix Primitives directly, no
shadcn, `lucide-react` for icons. This phase is the actual *design* pass
editor-ui-stack.md deliberately left out of scope ("tooling, not a new
visual language").

- [ ] Design tokens for the product chrome: a real color scale (not just
  `#111`/`#fff`), spacing scale, and type scale as CSS custom properties
  or a Tailwind theme extension — applied consistently across dashboard
  and editor, not per-component ad hoc values.
- [ ] Dashboard screens (site list, site detail, Collections, Theme
  Builder list, Settings, Members, API keys): replace bare forms/tables
  with a consistent card/section/table visual language, real empty states
  (the "No sites yet. Create one above." pattern, but designed, with an
  actual illustration/icon and a clearer call to action), and consistent
  button hierarchy (primary/secondary/destructive).
- [ ] Editor chrome: toolbar, layers panel, inspector polish — keep the
  existing dense/tool-like layout (this is right for an Operate surface,
  per editor-ui-stack.md's Puck/Craft.js rejection reasoning) but apply
  the same token system, fix the two known-broken modals
  (`MediaPicker`/`VersionHistoryPanel`) via `@radix-ui/react-dialog`
  (focus trap, Escape, `aria-modal`), and swap the breakpoint toggle to
  `@radix-ui/react-toggle-group`.
- [ ] Auth screens (login/signup/invite-accept): currently the plainest
  screens in the product and every self-hoster's and every invited
  EDITOR's literal first impression — bring them up to the same token
  system first, before the denser dashboard/editor screens, since they're
  the highest-leverage low-effort fix.
- [ ] Empty/first-run states across the dashboard (no sites, no pages, no
  collections, no members, no API keys) — each currently a single gray
  line of text; this is the actual onboarding experience for a fresh
  self-host install and deserves real design, not an afterthought.
- [ ] Accessibility pass once the above lands: keyboard operability
  through the editor canvas/layers tree, focus-visible states, color
  contrast against the new token system (see PRODUCT.md's Accessibility
  & Inclusion — no elevated bar established, but standard web a11y
  practice is the floor).

## Phase B — Default page templates + theme presets

Currently: a new Page starts as one empty `section` block. A new Site's
`Theme` starts with whatever bare default tokens `lib/theme.ts` seeds —
there is no "pick a starting point" moment anywhere in the product. This
phase is the one the roadmap conversation that produced this doc explicitly
asked to build next.

- [ ] **A small set of polished page templates** (not a huge marketplace —
  quality over quantity), each a real, finished-looking composition of
  existing block types (section/text/image/button/heading/spacer/columns/
  embed/list/form/newsletter — see
  [blocks-and-theming.md](blocks-and-theming.md)) with good copy,
  spacing, and imagery placeholders. Starting set: a **Landing/Home**
  page (hero + feature grid + testimonial-style section + CTA + footer
  handoff), an **About** page, a **Contact** page (form block wired to
  `storeOnly`), and a **Blog index + post** pair (uses the existing
  Collections/dynamic-page system, not a bespoke blog engine — see
  [collections.md](collections.md)). This supersedes the old
  [starter-templates.md](starter-templates.md) "port an external repo"
  plan — that doc assumed access to a sibling `../blog-template` repo
  that was never actually available in this workspace; build the
  equivalent presentational quality directly as block-tree templates
  here instead of depending on that port.
- [x] **A handful of theme presets** — `lib/themePresets.ts`: four
  distinct palettes (Signal, Ink, Terrace, Midnight), each with its own
  type/spacing scale. Offered in the site-creation form (creates the
  `Theme` row with the preset's tokens; omitting it keeps the old
  behaviour of no Theme row + `DEFAULT_THEME_TOKENS`) and as a "Start
  from a preset" row in the theme editor. `tests/themePresets.test.ts`
  holds them to the readability bar they'd otherwise be shipped past:
  body and secondary text clear 4.5:1 on their own ground, and `primary`
  carries a white button label.
- [x] **"Start from a template" step** in the site/page creation flow —
  shipped ahead of this doc as the "Create a full site" panel plus the
  "New Page" template picker (docs/site-templates-plan.md).
- [x] Extend the Theme Builder's existing header/footer template system
  with **default header/footer templates** — `lib/chromeTemplates.ts`.
  Creating a header or footer Template now seeds authored content
  instead of one empty section (`blank: true` opts out, surfaced as a
  checkbox in `TemplatesPanel`). Every value is a `$token` reference, so
  the chrome wears whichever preset the site started from and follows
  later theme edits.
- [ ] Once this phase has shipped enough real visual work under one
  identity, consider `/impeccable document` to record it as this
  surface's `DESIGN.md` — not before there's an actual visual world to
  document.

## Resolved: component/styling framework

**Decided 2026-08-28: stay on Tailwind + Radix primitives directly, no
shadcn/ui**, for the dashboard as well as the editor. The `.chrome-*`
token layer in `globals.css` already exists and is adopted across the
editor chrome and the auth screens; adding a second component idiom for
the dashboard alone would mean two vocabularies in one product and a
default shadcn look to override. Remaining Phase A screens extend the
existing token layer.

The original framing is kept below for the reasoning that fed the call.

### Original open question

editor-ui-stack.md already evaluated this once and landed on Tailwind
(already installed) + Radix Primitives directly, explicitly rejecting
shadcn/ui's copy-pasted, pre-styled components as fighting the editor
chrome's dense, tool-like density. The user asked (2026-08-23) to use a
styling framework "if possible" for this Phase A work — worth an explicit
revisit rather than silently overriding that prior call: a component
library (shadcn/ui, or a similar pre-built kit) could speed up the
*dashboard* screens specifically (which are closer to a conventional
SaaS admin UI than the dense editor canvas chrome is), even if the editor
toolbar/layers/inspector still want the leaner direct-Radix approach.
Revisit with the user before the next Phase A screen if this hasn't been
resolved yet; the design tokens in `globals.css` (`.chrome-*` classes)
were written framework-agnostic enough to not block that decision either
way.

## Sequencing

Phase A (product chrome) and Phase B (default templates/themes) are
independent — different files, different visual worlds, no shared
component surface — and can be worked in either order or in parallel.
Phase B was the one requested first; Phase A's auth-screens item is the
best next pickup after it given its effort-to-visibility ratio.

## Explicitly out of scope

- A full marketplace or gallery of many templates — this roadmap is about
  a small number of genuinely polished starting points, not breadth.
- Redesigning `BlockRenderer`/the block registry/the public renderer's
  mechanics — this whole doc is visual/content work on top of the
  existing, unchanged block system (architecture.md's shared-codepath
  rule is untouched by anything here).
- A rebrand or new product name/logo for OpenSite Studio itself — Phase A
  is a design system for the *existing* identity, not a new one (see
  PRODUCT.md's Brand Commitments: no logo/color identity confirmed yet,
  and this doc doesn't decide one unprompted).
