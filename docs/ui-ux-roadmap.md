# UI/UX roadmap

The functional roadmap is done ([roadmap.md](roadmap.md)); this is the
live one. Two surfaces, two different design modes (see
[apps/web/PRODUCT.md](../apps/web/PRODUCT.md)'s Operating Context):

- **Product chrome** (dashboard + editor) is an **Operate** surface. The
  visitor is doing a task; scanability and density beat expression.
- **Templates and theme presets** are a **Persuade** surface — content a
  site owner ships to *their* visitors.

Neither blocks a self-hoster from using the product. Both decide whether
it can be handed to the non-technical EDITOR persona that's the entire
point of a Wix/Elementor alternative.

## The design system, as it stands

`.chrome-*` in `app/globals.css` is the chrome's whole visual vocabulary:
one committed light theme (an admin surface benefits more from a
predictable appearance than from silently flipping with the OS), a
restrained neutrals-plus-one-accent palette, and card/input/button/label/
tab/toggle primitives applied by class rather than as scattered inline
`rounded border px-3 py-2` chains.

Already on it: the auth screens, the site list and site detail, Pages,
Members, API keys, Theme, Theme Builder, and the editor's toolbar,
inspector, section picker, floating panel and drag chrome. `MediaPicker`
and `VersionHistoryPanel` are Radix dialogs with real focus traps, and
the breakpoint control is a Radix toggle group.

A new site also has starting points now, where it used to begin blank:
four theme presets (`lib/themePresets.ts` — Signal, Ink, Terrace,
Midnight, each held to a contrast bar by `tests/themePresets.test.ts`),
six full-site templates and five single-page ones in the creation flows,
and authored default header/footer content when a Theme Builder template
is created (`lib/chromeTemplates.ts`, all `$token` references so the
chrome wears whichever preset the site started from).

## Remaining

- [ ] **The screens still off the token layer.** In the dashboard:
  Collections and the collection editor, Settings, Locales, Submissions,
  sitemap import, custom fonts, popup triggers, template targeting, and
  the invite-accept button. In the editor: the layers panel, form-fields
  editor, SEO panel and clipboard panel. Each is still bare
  `<input>`/`<button>` markup.
- [ ] **Empty and first-run states** on those same screens. The ones
  already converted got designed empties; the rest are still a single
  gray line of text, which is the actual onboarding experience for a
  fresh self-host install.
- [ ] **An accessibility pass over the chrome itself**, once the above
  lands: keyboard operability through the editor canvas and layers tree,
  focus-visible states, and contrast against the token palette. Note the
  asymmetry worth closing — the product now audits *its users'* pages for
  exactly this (`lib/a11y.ts`) and has never been pointed at itself.
- [ ] **A standalone About and Contact page template.** The single-page
  picker has blank/landing/home/blogIndex/blogPost; About and Contact
  exist only inside the six full-site genres.
- [ ] Once there's enough real visual work under one identity, consider
  recording it as this surface's `DESIGN.md` — not before there's an
  actual visual world to document.

## Decided: no component framework

**2026-08-28: Tailwind + Radix primitives directly, no shadcn/ui**, for
the dashboard as well as the editor. This revisits an explicit request to
use a styling framework "if possible" rather than silently overriding it:
the `.chrome-*` layer already exists and is adopted across the editor and
auth screens, so adding shadcn for the dashboard alone would mean two
component idioms in one product and a default look to override.
[editor-ui-stack.md](editor-ui-stack.md) has the original evaluation,
including why Puck and Craft.js were rejected outright.

## Explicitly out of scope

- A marketplace or gallery of many templates — a small number of
  genuinely polished starting points, not breadth.
- Redesigning `BlockRenderer`, the block registry, or the public
  renderer's mechanics. Everything here is visual work on top of the
  unchanged block system; architecture.md's shared-codepath rule is
  untouched by any of it.
- A rebrand, new product name or logo. This is a design system for the
  existing identity, not a new one (PRODUCT.md's Brand Commitments: no
  logo or color identity is confirmed, and this doc doesn't decide one
  unprompted).
