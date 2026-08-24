# Full site templates — scope, phases, and status

Source material: `docs/reference-sites-research.md`/`docs/reference-sites-plan.md`
(the block-library work) plus a second local reference,
`C:\Users\Tobi\Repos\tourism-wix-generator` — a separate repo with 6
hand-built Astro hotel/tourism site templates (alpine-editorial,
hotel-modern-alpine, meadow, nordic-stone, townhouse, verde). Their
structural patterns (split hero, page-hero for subpages, alternating
feature rows, stats row, quote block, "explore tiles" grid) informed the
SaaS template below and are the intended reference for the hospitality
templates (Restaurant/Hotel/Bar) still to come.

## Scope

Build a library of **complete, multi-page site templates**, one per
genre, each genre a cohesive set of pages sharing one palette/type
system/nav/footer — not single isolated landing pages like
`lib/pageTemplates.ts`'s original `landingPageTemplateContent`. Every
template must clear two bars:

- **Bulletproof**: no rendering bugs, no invisible/low-contrast text, no
  broken bindings — verified live in the browser (editor canvas + public
  `/preview`), not just by reading the generated JSX.
- **Pretty**: real design intent per genre (palette, type pairing,
  restraint) — not a recolor of the same layout six times. Every
  template should use scroll-in animation (`ANIMATION_FIELD`) on its
  major sections and real (placeholder) images (`placehold.co`), not
  bare text blocks.

All template copy stays deliberately generic/placeholder ("Replace with
...") — never a fabricated real metric, testimonial, or company name, per
the existing convention in `lib/pageTemplates.ts`.

## Genres (6 total)

| Genre | Pages | Status |
|---|---|---|
| SaaS / tech product | Home, Features, Pricing, About, Contact | ✅ Done — `lib/siteTemplates.ts` |
| Agency / creative services | Home, Work, Services, About, Contact | 🔶 Built, not live-verified (no dev Postgres in this pass) — `lib/siteTemplates/agency.ts` |
| Personal portfolio | Home, Work, About, Contact | 🔶 Built, not live-verified (no dev Postgres in this pass) — `lib/siteTemplates/portfolio.ts` |
| Restaurant | Home, Menu, About, Contact/Reservations | 🔶 Built, not live-verified (no dev Postgres in this pass) — `lib/siteTemplates/restaurant.ts` |
| Hotel | Home, Rooms, Amenities/Gallery, Contact/Book | 🔶 Built, not live-verified (no dev Postgres in this pass) — `lib/siteTemplates/hotel.ts` |
| Bar | Home, Menu (drinks), Events, Contact | 🔶 Built, not live-verified (no dev Postgres in this pass) — `lib/siteTemplates/bar.ts` |

Restaurant/Hotel/Bar were originally one "local business/hospitality"
bucket — split into three separate templates per direct request, since a
restaurant and a boutique hotel don't share an IA even though both are
hospitality. `tourism-wix-generator`'s Nordic Stone template (split hero,
grayscale-filtered photography, thin rules, "explore tiles") is the
strongest structural reference for Hotel specifically; Restaurant/Bar
need their own lighter-weight pass (menu-as-list-block, no
booking/rooms system).

## Architecture (established by the SaaS template, reuse for every genre)

- `lib/siteTemplateOptions.ts` — client-safe catalog (`SITE_TEMPLATES`:
  id/name/description/pages\[\]), imported by `PageList.tsx`.
- `lib/siteTemplates.ts` — server-only content builders (uses
  `crypto`'s `randomUUID`, same client/server split as
  `pageTemplateOptions.ts`/`pageTemplates.ts`) + `siteTemplatePageContent(templateId, slug)`
  dispatcher.
- `app/api/sites/[siteId]/site-templates/route.ts` — POST creates every
  page a template defines in one transaction, skipping (not failing on)
  any slug that already exists — idempotent, safe to re-run.
- `components/dashboard/PageList.tsx` — "Create a full site" panel next
  to the existing single-page "Create page" form.
- Per genre: a `mk`/`heading`/`body`/`cta`/`bleed` helper set (copy the
  SaaS section's shape, new palette constant), a shared nav/footer/
  page-hero function, and one exported `*Template()` function per page.

### Bugs found and fixed while building the SaaS template (apply this checklist to every new genre)

1. **Stat counter on a dark band**: `statCounter`'s default `valueColor`
   is near-black — invisible on an ink-colored section. Any stat row
   dropped onto a dark `bleed()` needs explicit light `valueColor`/
   `labelColor`.
2. **Identical placeholder labels in one `contentSwitcher`**: three
   items all saying "Replace with a name" makes the switcher's own list
   unreadable (which one is selected?) — number them ("Replace with name 1/2/3").
3. Always spot-check any block placed on a non-default background for
   contrast, not just the copy.

## Phases

- **Phase A — SaaS template.** ✅ Done: 5 pages, "Create a full site" UI
  wired end-to-end, verified live (fresh site, all 5 pages, editor +
  preview), the two bugs above found and fixed, animations + placeholder
  images added to every major section. Committed/pushed.
- **Phase B — Agency / creative services template.** Home, Work
  (portfolio grid — `contentSwitcher` or `list`+`imageOverlay`), Services,
  About, Contact. Reference: `docs/reference-sites-research.md`'s
  Heretic/Métier entries (high-contrast, portfolio-forward).
- **Phase C — Personal portfolio template.** Home, Work, About, Contact.
  Reference: Karolina Hess/Métier entries (minimal, confident type,
  work-sample-forward).
- **Phase D — Restaurant template.** Home, Menu, About,
  Contact/Reservations. Reference: Banh Mi & You entry + a lighter cut of
  `tourism-wix-generator`'s structure (no rooms/booking system needed).
- **Phase E — Hotel template.** Home, Rooms, Amenities/Gallery,
  Contact/Book. Reference: `tourism-wix-generator`'s nordic-stone
  template directly (split hero, page-hero subpages, explore-tiles grid,
  stats row, restrained stone/ice palette translated into OpenSite
  Studio's block system). 🔶 Code complete (`lib/siteTemplates/hotel.ts`,
  wired into the dispatcher + catalog; `tsc`/`eslint`/`build` all pass
  clean) but **not live-verified** — no dev Postgres was available in
  this pass, so the "bulletproof" bar (live browser check across editor
  canvas + `/preview`) is still outstanding. Built from
  `tourism-wix-generator`'s nordic-stone reference as described in this
  doc, not the original repo, which wasn't available in this worktree.
- **Phase F — Bar template.** Home, Menu (drinks), Events, Contact.
  Reference: relief.pisapain/NKORA entries for mood, adapted to a
  bar/nightlife register (darker palette, marquee for a "as seen in"/
  event strip).
- **Phase G — Bugfixing pass (deferred, tracked separately).** The
  editor-canvas-only background-bleed issue flagged mid-session (**not**
  reproduced on the public/preview render path — editor-canvas-specific,
  root cause not yet identified). Revisit after Phases B–F so it's fixed
  once against the full, final block/template surface rather than
  mid-flight.
- **Phase H — Final polish + verification pass.** Once all 6 genres
  exist: confirm every genre's major sections carry an `animation` value
  and every image-bearing block has a real `placehold.co` src (per
  direct request — "make sure all have animations and sample images"),
  then one `code-review`/`impeccable` pass across the whole
  `lib/siteTemplates.ts` surface before calling the library done.

## Todo

- [x] Phase A — SaaS template (5 pages, bulletproof + animated + shipped)
- [ ] Phase B — Agency template (5 pages code-complete, `tsc`/`build`/`eslint` clean; left unchecked — live editor/preview verification still outstanding, no dev Postgres in this pass, same bar as Phase C below)
- [ ] Phase C — Personal portfolio template (code built and tsc/eslint/build-clean — `lib/siteTemplates/portfolio.ts` — left unchecked because no dev Postgres was available in this pass, so it hasn't cleared the "bulletproof" live-browser bar Phase A's checked box implies)
- [ ] Phase D — Restaurant template (code-complete — `lib/siteTemplates/restaurant.ts`, dispatcher + catalog wired — left unchecked: not live-verified in editor/preview, no dev Postgres in this pass)
- [ ] Phase E — Hotel template (code-complete — `lib/siteTemplates/hotel.ts`, dispatcher + catalog wired — left unchecked: not live-verified in editor/preview, no dev Postgres in this pass)
- [ ] Phase F — Bar template (code-complete — `lib/siteTemplates/bar.ts`, dispatcher + catalog wired — but left unchecked: not live-verified in editor/preview, no dev Postgres available in this pass)
- [ ] Phase G — Editor-canvas background-bleed bugfix
- [ ] Phase H — Final animation/image/quality pass across all 6 genres
- [ ] Commit + push after each phase (matches this session's established cadence — never batch multiple genres into one commit)

## Skills — which to use for what

| Skill | When |
|---|---|
| `hallmark` | Before starting each new genre's palette/type/copy pass — anti-AI-slop calibration (restrained accent, confident type scale, honest copy, no fabricated metrics). Already the design basis for the existing 27-preset section library (`lib/sectionPresets.ts`); apply the same bar here. |
| `frontend-design` | Alongside `hallmark` for the aesthetic-direction decisions specific to each genre (Hotel's stone/ice restraint vs. Bar's darker nightlife register vs. Agency's high-contrast portfolio look) — distinct visual identities, not six recolors of the same layout. |
| `impeccable` | A review pass per finished genre template (hierarchy, spacing, contrast, responsive behavior) — catches exactly the class of bug Phase A found (stat-counter contrast) before it ships, not after. |
| `webapp-testing` | For Phase H's cross-template verification — Playwright-driven checks across 6 genres × ~5 pages (30 pages) are more reliable and token-cheaper than manual browser-tool clicking through each one by hand. |
| `simplify` | After Phase F, on `lib/siteTemplates.ts` as a whole — by then it holds 6 genres' worth of near-duplicate `mk`/`heading`/`body`/`cta`/`bleed` helpers; worth extracting the truly-shared pieces (the helper shapes themselves, not the palettes/copy) into one common module. |
| `code-review` | End of Phase H, once per the whole feature — the "bulletproof" quality gate before considering the template library finished. |
| `security-review` | **Not** run per-phase — stays deferred until all roadmap + template work is complete, per `AGENTS.md` rule #12. |

### Suggested new skill (lower token cost per genre)

Building Phase A required re-deriving, from scratch, in this
conversation: every Phase 1–5 block's exact prop/style shape
(`AccordionItem`/`PricingTier`/`ContentSwitcherItem`/`ComparisonColumn`/
`ComparisonRow`), the `mk`/`bleed` helper pattern, the "generic
placeholder copy only" rule, and the stat-counter-contrast gotcha above —
all real context that Phases B–F would otherwise re-derive identically
five more times. A packaged skill (e.g. `opensite-site-template`) capturing:

- the block-type prop/style reference (the exact shapes, current as of
  Phase 1–5's block system),
- the `mk`/`heading`/`body`/`cta`/`bleed` helper pattern as a starting
  file,
- the placeholder-copy rule,
- the verified gotcha checklist above,
- the "create page → tsc/eslint/build → live browser spot-check on both
  editor and /preview" verification loop,

... would let each subsequent genre start from that packaged context
instead of this conversation's accumulated discovery, meaningfully
cutting token cost per phase. Worth building via `skill-creator` once
Phase B confirms the pattern generalizes (building it after Phase A
alone risks baking in something SaaS-specific that doesn't fit
Hotel/Restaurant's different page shapes).

## Notes from later review (not yet scoped into phases above)

- **Multiselect delete should extend beyond Collections.** Shipped for
  Collection items (`CollectionEditorClient.tsx`'s Items table — header
  select-all + per-row checkboxes + "Delete N selected", firing the
  existing per-item DELETE route concurrently rather than adding a new
  bulk endpoint). Direct feedback: the same pattern is wanted "not just
  in collections but in the pages list etc." — `PageList.tsx`'s page
  table (`handleDelete`, currently one-at-a-time via a per-row Delete
  button) is the next candidate, and any other item-list-with-delete
  surface in the dashboard should get the same treatment for
  consistency. Not yet scoped as its own phase — pick up alongside or
  after Phase G.
- **Collections-as-data-binding is under reconsideration.** Direct
  feedback: "I dont quite like that as a logical solution for connecting
  data to Components" — the current Collection → `$bind` → block-prop
  model (see `AGENTS.md`/`docs/index.md` for how `$bind` currently
  resolves) is being questioned as the right mental model for wiring
  data into components, but no alternative has been discussed yet.
  Explicitly deferred: "we will review the collections thing later."
  Don't invest further in the Collections binding UX (beyond what
  already exists) until that review happens — flag before extending it
  further (e.g. before building richer bind UI or new bind sources).

## Suggested subagent use

Phases B–F are **structurally independent** of each other — different
palette constants, different helper functions, different page sets, no
shared mutable state, and (if split into one file per genre, e.g.
`lib/siteTemplates/agency.ts`, `lib/siteTemplates/hotel.ts`, ... rather
than one growing monolithic file) **no file-collision risk** — unlike
Phase 1's six block types, which all had to touch the same
`registry.tsx` and were explicitly built sequentially for exactly that
reason. This is the shape of work this session's own history already
flagged as parallelizable (the Plugin SDK/Multilingual/Programmatic
Access phases, per `docs/reference-sites-plan.md`'s own "Subagent
feasibility" section).

Concretely: once the suggested skill above exists (or even without it,
handing each agent this doc + the finished `saas.ts` as a pattern to
follow), Phases B–F could run as four parallel agents — each producing
one self-contained template file — reviewed and wired into the
dispatcher afterward, rather than four sequential single-threaded passes
in one conversation. Only worth doing on explicit request (subagents
aren't invoked automatically per this session's own operating rules) —
noted here as a recommendation, not started.
