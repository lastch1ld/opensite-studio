# Full site templates

The library of complete, multi-page site templates — one per genre, each a
cohesive set of pages sharing one palette, type system, nav and footer.
Not single isolated landing pages like `lib/pageTemplates.ts`'s starters.
All six genres are built; this doc is how they work, the bar they're held
to, and the lessons worth carrying into a seventh.

## Block system design vocabulary (2026-08-26)

Direct feedback after the three new hotel templates: "they look once
again way too generic... i wanna be able to build beautiful clean
webpages in the editor not basic generic saas pages." Root cause wasn't
the templates' copy/palette choices — it was that `components/blocks/
registry.tsx` only ever produced flat-fill bands, uniform equal-width
card grids, and browser-default type spacing, so no re-skin could read
as premium design; every genre converged on the same hero →
equal-card-grid → flat-CTA-band shape because that was the entire
available vocabulary. Extended the registry with four additive, opt-in
capabilities (nothing renders differently until a template/user actually
sets one):

- **Gradient backgrounds** (`gradientFrom`/`gradientTo`/`gradientAngle`)
  on `section` and `hero` — composed as an explicit background-image
  layer alongside the existing texture/photo layers, not a replacement
  of the `background` shorthand.
- **Type refinement** (`letterSpacing`/`lineHeight`) on `heading`/`text`
  — `heading` previously hardcoded `lineHeight: 1.15` with no override.
- **Photo treatment** (`imageTreatment`: grayscale/warm duotone/cool
  duotone) on `image`/`imageOverlay` — a CSS `filter` on the `<img>`,
  makes placeholder photography read as one deliberate palette instead
  of whatever hue each individual placehold.co box happens to be.
- **Overlap via negative margin** (`marginTop`, negative values) on
  `section` — a real device for a card/panel floating across the bottom
  of a hero photo. True `position: absolute` overlap was considered and
  rejected: every block in the editor canvas is already wrapped in its
  own `position: relative` selection/drag-handle box (BlockRenderer.tsx/
  DragHandleWrapper.tsx), so an absolutely-positioned child would anchor
  to its own tight wrapper instead of the intended ancestor. Negative
  margin has no such conflict — it works through normal document flow.

Demonstrated on `hotelModern.ts`'s Home page: the "Rooms & rates" panel
now floats over the hero photo (`marginTop: "-96px"`, `borderRadius`,
`boxShadow: "elevated"`), room/feature photos carry the warm-duotone
treatment, nav links and labels are tracked-out small caps
(`letterSpacing: "0.06em"`), and the closing CTA band uses a real
two-stop gradient instead of a flat fill. Live-verified (desktop +
mobile, `/preview`), no console errors. **Not yet propagated** to the
Boutique/Resort hotel templates or any other genre — natural next step,
either on request or as part of a broader consistency pass.

Deferred (higher risk, not attempted this pass): asymmetric `columns`
spans (`gridColumn: span N` on a child) — the plumbing exists in
principle (BlockRenderer.tsx's existing `cloneElement` prop-injection
for the public path, `DragHandleWrapper`'s `block` prop for the editor
path) but needs the two paths implemented and kept in sync deliberately,
the same class of editor/public divergence bug this session already hit
multiple times elsewhere. True absolute-position overlap has the same
wrapper-architecture conflict noted above and would need a deliberate
redesign of that wrapper, not a field addition.


Source material: `docs/reference-sites-research.md`/`docs/reference-sites-plan.md`
(the block-library work) plus a second local reference,
`C:\Users\Tobi\Repos\tourism-wix-generator` — a separate repo with 6
hand-built Astro hotel/tourism site templates (alpine-editorial,
hotel-modern-alpine, meadow, nordic-stone, townhouse, verde). Their
structural patterns (split hero, page-hero for subpages, alternating
feature rows, stats row, quote block, "explore tiles" grid) informed the
SaaS template below and are the intended reference for the hospitality
templates (Restaurant/Hotel/Bar) still to come.

Structural reference for the hospitality genres was
`tourism-wix-generator`, a separate repo of hand-built Astro hotel
templates: its split hero, page-hero-for-subpages, alternating feature
rows, quote block and "explore tiles" grid. Mood references per genre are
in [reference-sites-research.md](reference-sites-research.md).

## The genres

| Genre | Pages | File |
|---|---|---|
| SaaS / tech product | Home, Features, Pricing, About, Contact | ✅ Done — `lib/siteTemplates.ts` |
| Agency / creative services | Home, Work, Services, About, Contact | ✅ Live-verified (editor canvas desktop+mobile, `/preview`, all 5 pages) — `lib/siteTemplates/agency.ts` |
| Personal portfolio | Home, Work, About, Contact | ✅ Live-verified (editor canvas desktop+mobile, `/preview`, all 4 pages) — `lib/siteTemplates/portfolio.ts` |
| Restaurant | Home, Menu, About, Contact/Reservations | 🔶 Built, not live-verified (no dev Postgres in this pass) — `lib/siteTemplates/restaurant.ts` |
| Hotel — Modern | Home, Rooms, Amenities, Contact & Book | ✅ Live-verified (`/preview`, all 4 pages) — `lib/siteTemplates/hotelModern.ts`. Near-black navy + steel-blue, Plus Jakarta Sans. Reference: Framer's "Mariven" template. |
| Hotel — Boutique | Home, Rooms, Amenities, Contact & Book | ✅ Live-verified (`/preview`, all 4 pages) — `lib/siteTemplates/hotelBoutique.ts`. Warm parchment + olive + terracotta, arch-shaped photo motif, Instrument Serif. Reference: Framer's "Toscana" template. |
| Hotel — Resort | Home, Rooms, Amenities, Contact & Book | ✅ Live-verified (`/preview` + mobile, all 4 pages) — `lib/siteTemplates/hotelResort.ts`. Near-black ink + gold, Fraunces. Reference: Framer's "Luxen Resort" template. |
| Bar | Home, Menu (drinks), Events, Contact | 🔶 Built, not live-verified (no dev Postgres in this pass) — `lib/siteTemplates/bar.ts` |

Restaurant, Hotel and Bar started as one "hospitality" bucket and were
split, because a restaurant and a boutique hotel don't share an
information architecture even though they share an industry.

## Architecture

- `lib/siteTemplateOptions.ts` — client-safe catalog (`SITE_TEMPLATES`:
  id/name/description/pages), imported by `PageList.tsx`.
- `lib/siteTemplates/` — server-only content builders (they use `crypto`'s
  `randomUUID`, the same client/server split as
  `pageTemplateOptions.ts`/`pageTemplates.ts`), one module per genre plus
  `_shared.ts` for the `mk`/`heading`/`body`/`cta`/`bleed`/`badge` helpers
  and `index.ts` for the `siteTemplatePageContent(templateId, slug)`
  dispatcher. One file per genre so genres can be authored independently,
  including in parallel, without touching a shared growing file.
- `app/api/sites/[siteId]/site-templates/route.ts` — POST creates every
  page a template defines in one transaction, skipping (not failing on)
  any slug that already exists, so it's idempotent and safe to re-run.
- `app/api/sites/[siteId]/generate/route.ts` — the same batch, with the
  placeholder copy filled in by a model ([ai-mode.md](ai-mode.md)).
- `components/dashboard/PageList.tsx` — the "Create a full site" panel.

Every page root is `[nav, ...content, footer]`. The nav and footer are
baked into each page rather than coming from a Theme Builder template: a
page template only ever produces one Page's `draftContent`, and baking
them in is what makes the pages read as one site from the moment they're
created.

## The bar

**Copy is always placeholder** — "Replace with a headline", never a
fabricated metric, testimonial, rate or company name. That convention now
does double duty: those strings are the slots AI generation fills, and
they were written to tell a human what belongs there, which turns out to
work just as well on a model (`lib/aiGenerate.ts`).

**`tests/siteTemplates.test.ts` enforces the rest**, per template page:
only registered block types, unique block ids, a real image on every
image-bearing block, distinct `contentSwitcher` labels, an `animation`
value on every content section (nav and footer excluded — scroll-revealing
chrome that's already on screen would be a bug, not polish), and a clean
pass of the product's own accessibility audit (`lib/a11y.ts`), errors and
heading order included. A template that ships with the product must not
fail the audit the product runs on everyone else's pages.

That last check earned itself: pointed at the finished templates it found
41 real contrast failures across five genres, all since fixed. The
recurring cause is worth naming, because it will happen again — **an
accent color tuned as a surface is not a text color.** The signal orange
sat at 3.0:1 on paper; white on it reached only 3.4:1, so its CTA bands
couldn't hold body copy either. Each palette now separates the surface
color from the deepened variant that carries small text (`accentInk`,
`accentText`, `clayText`, `iceText`, and so on).

- [x] Phase A — SaaS template (5 pages, bulletproof + animated + shipped)
- [x] Phase B — Agency template (5 pages, live-verified in editor canvas desktop+mobile + `/preview`; found and fixed one real bug — the Work page's "More projects" grid used `list` with no `collectionId`, which only ever does one repeat pass and rendered all 3 images inside a single stacked grid cell instead of 3 columns; swapped for `columns`)
- [x] Phase C — Personal portfolio template (4 pages, live-verified in editor canvas desktop+mobile + `/preview`; no bugs found — clean on first pass)
- [ ] Phase D — Restaurant template (code-complete — `lib/siteTemplates/restaurant.ts`, dispatcher + catalog wired — left unchecked: not live-verified in editor/preview, no dev Postgres in this pass)
- [x] Phase E — Hotel template. Originally one "nordic-stone" register; **replaced with three separate hotel templates** per direct request ("go through framer for templates we can reproduce... a new beautiful cleansheet design and then 2 other separate hotel page templates") — `hotel.ts` deleted, catalog id `hotel` retired, replaced by `hotel-modern`/`hotel-boutique`/`hotel-resort` in `siteTemplateOptions.ts` + the dispatcher. Each researched directly off a live Framer hotel template (see table above) rather than recolored from this codebase's existing genres. All three live-verified, 4 pages each, `/preview` (+ mobile spot-check on Resort's densest 4-column grid). While live-verifying the original single hotel.ts before the rebuild, found and fixed one real bug now baked into all three: `imageOverlay`'s wrapper div never set an explicit `width`, relying entirely on inheriting one from a stretching flex/grid parent; a card wrapper using `align: "flex-start"` opted out of that stretch, collapsing room-rate photos to 0×0 on the actual published page. Fixed at the registry level (`width: "100%"` added alongside the existing height fallback in `registry.tsx`'s `imageOverlay`) — spot-checked Bar's hero afterward for regressions, none found.
- [ ] Phase F — Bar template (code-complete — `lib/siteTemplates/bar.ts`, dispatcher + catalog wired — but left unchecked: not live-verified in editor/preview, no dev Postgres available in this pass)
- [ ] Phase G — Editor-canvas background-bleed bugfix
- [ ] Phase H — Final animation/image/quality pass across all 6 genres
- [ ] Commit + push after each phase (matches this session's established cadence — never batch multiple genres into one commit)

## Lessons for a seventh genre

**Don't reskin `saas.ts`.** Every genre's home page originally copied its
section *sequence* — hero → logos → grid → stat row → CTA — even where
palette, type and copy were genuinely distinct. The result was a
restaurant showing "90%" (of what?) and a bar showing "40+" with no
referent, while neither mentioned hours or location. Work out what that
business's homepage visitor is actually deciding — book a table? check a
rate? see if the studio's work is good? — and build the section list from
that before reaching for another genre's shapes. SaaS and Portfolio kept
their stat rows, because a SaaS product and a freelancer legitimately have
numbers worth showing.

**Watch what a block's defaults do on your background.** `statCounter`'s
default `valueColor` is near-black and vanishes on a dark band; the
contrast test catches this now, but the same class of trap applies to any
block dropped onto a non-default background.

**Number your repeated placeholders.** Three `contentSwitcher` items all
reading "Replace with a name" make the switcher's own list unreadable —
which one is selected?

## Open question: Collections as data binding

Direct feedback: "I don't quite like that as a logical solution for
connecting data to Components." The current Collection → `$bind` →
block-prop model (see `AGENTS.md` and [index.md](index.md) for how `$bind`
resolves) is being questioned as the right mental model, but no
alternative has been discussed and the review was explicitly deferred.

Until it happens, don't invest further in the Collections binding UX
beyond what exists — flag it before building richer bind UI or new bind
sources.
