# Reference-site capability plan

Source material: `reference-sites-research.md` (13 sites researched via 4
parallel subagents — see "Subagent feasibility" below). This doc turns
that research into a gap analysis against OpenSite Studio's current block
system, then a phased build plan.

**Ground rule for every new capability below**: never scraped/copied
photography or real assets from the reference sites — every example uses
`placehold.co` placeholders or plain color blocks, same as the existing
Hero block and section-preset catalog (`lib/sectionPresets.ts`). The
reference sites are structural/technical inspiration only.

## Current baseline (for context)

Block types: `section`, `hero` (full-bleed container), `text`, `image`,
`button`, `heading`, `spacer`, `columns`, `embed` (iframe/raw HTML),
`list`/`grid` (Collection-bound repeater), `form`, `newsletter`. Style
vocabulary: padding, background, color, fontSize, fontWeight, textAlign,
borderRadius, gap, align/justify, offsetX/Y/zIndex, a curated 5-font
`fontFamily` picker, animate-on-scroll (fade/slide/scale, fire-once via
Motion `whileInView`), responsive column-count collapsing (3→2→1,
desktop/tablet/mobile). Also: Collections (typed datasets + repeater
pages), Theme Builder (header/footer/popup templates), multilingual
(Locale/Translation), a 27-preset section library across 3 style kits.

## Gap analysis

Ordered by **prevalence × build effort** — the top of each tier is where
the plan spends Phase 1.

### Tier 1 — high prevalence, moderate effort, broadly reusable

| Capability | Sites | Why it's Tier 1 |
|---|---|---|
| **Accordion block** (real expand/collapse) | 7/13 | FAQ is nearly universal; current "FAQ Section" preset is static stacked text, not interactive. Radix `@radix-ui/react-accordion` — same primitive family already used elsewhere in the editor. |
| **Video block** | 4/13 (Heretic 7×, Supaste 10×) | No video primitive exists at all today (only iframe `embed`). Self-hosted or URL, autoplay/loop/muted/poster, is a well-scoped, self-contained block. |
| **Marquee/carousel block** | 5/13 | Testimonial and logo loops are extremely common. A CSS-animation-based infinite marquee (no drag/swipe needed for v1) is low-moderate effort and reusable for testimonials, logos, and stat strips alike. |
| **Pricing table block** | 2/13, but high genre-fit for SaaS/service pages | Tiered cards with an optional "featured" tier — much better result-per-edit than composing from `columns` + `section` by hand. |
| **Stat counter** (count-up-on-scroll number) | 1/13 direct, but broadly desirable | `motion` is already a dependency; animating a number 0→target on scroll-into-view is a small, contained addition to the existing animation system. |
| **Image + overlay caption** (image + scrim + positioned text as one block) | 2+/13 directly, implicitly desired everywhere photography carries a caption | Currently requires manually stacking an Image and an offset-positioned Text block — works, but is exactly the "as little editing as possible" gap the section-preset work already targeted. |

### Tier 2 — real gaps, higher effort, still broadly valuable

| Capability | Sites | Notes |
|---|---|---|
| **Inline rich text** (bold/italic/color on specific words within one text block, not the whole block) | 4/13 (Wishlabs, GrowthSync, Supaste, Karolina Hess) | The single most architecturally significant gap. Today `text`/`heading` are plain strings with one style for the whole block. A real fix means a rich-text content model (spans) and a rich-text editing UI in the Inspector — not a quick field addition. High value, but should be scoped as its own project, not bundled into a "quick wins" phase. |
| **Interactive list → content swap** (click/hover a list item, a paired panel updates) | 2/13 (Accoutrement's curator swap, GrowthSync's use-case cards) | Needs real client-side state within one block (which block-level render() functions can already do — see Phase 2 approach below). Self-contained; doesn't require new architecture. |
| **Before/after image comparison slider** | 1/13 | A known, well-defined interactive pattern (drag handle + clip-path). Self-contained block. |
| **Comparison table** (checkmark grid, one column visually emphasized) | 1/13 | Distinct enough from a plain `columns` grid (asymmetric per-column styling, checkmark/× cells) to warrant its own block rather than expecting hand-composition. |

### Tier 3 — motion upgrades (cross-cutting, affects many blocks at once)

| Capability | Sites | Notes |
|---|---|---|
| **`position: sticky` option** (any block can pin while its siblings scroll past) | NKORA, Karolina Hess, Métier — all use pinned images/footers/galleries | A single new style toggle (`sticky: true` + offset) unlocks the *pinned-while-content-scrolls* half of several patterns without touching the animation system at all. Cheap, high-leverage. |
| **Scroll-scrubbed animation mode** (opacity/transform driven continuously by scroll *progress*, not fired once on entry) | 7/13 — confirmed via direct script inspection on 3 sites, not just visual impression | Upgrades the existing "Animate in on scroll" field with a second mode using `motion`'s `useScroll`/`useTransform` (already a dependency — no new library). This is what several sites are *actually* doing where it looked like "just" a fade-in. Meaningfully more complex than the current fire-once implementation, but the library support is already in place. |
| **Horizontal scroll-jacked gallery** (NKORA) | 1/13 | The single hardest, most bespoke pattern in the entire set, and the lowest-prevalence (only NKORA). **Recommend explicitly declining** rather than building a generic primitive for a one-off — revisit only if a future reference brief specifically needs it. |

### Tier 4 — assets & branding

| Capability | Notes |
|---|---|
| **Custom font upload** (WOFF/WOFF2) | 5/13 sites use a bespoke/licensed font. The Media/asset-storage system already exists (used for images) — this is largely wiring a new asset kind + generating `@font-face` at publish time, not new infrastructure. Meaningfully more valuable than adding more curated Google Fonts, though a few more curated picks (a rounded sans, a condensed display, a mono) is a same-day cheap win in the meantime. |
| **Background texture/noise option** | Métier's paper-grain background. Cheap: a CSS SVG-noise data-URI toggle on `section`/`hero` backgrounds. |

### Tier 5 — content modeling (mostly *verification*, not new build)

| Capability | Notes |
|---|---|
| **Status/tag badges on list items** (availability: "Sold Out"/"Only 1 Room Left"; dietary: "vegan") | Accoutrement, Banh Mi & You | Maps directly onto the existing Collections system (a typed field on a Collection) plus a small "badge" rendering option on `list`/`grid` items — not a new block type, just extending what a Collection-bound list can display per item. |
| **Client-side filterable/tagged grid** (Mosaic's 18-category filter over a large card grid) | 1/13 | Also a Collections-shaped problem (tag field + filter UI over a `list`/`grid` block), not a new block primitive. Worth doing once Tier 5's badge work lands, since it's the same underlying data shape. |
| **Map embed** | Banh Mi & You | **Already fully covered** by the existing `embed` (iframe) block. No work needed — confirms the boundary is right. |

## Explicitly out of scope

Reaffirming and extending `docs/roadmap.md`'s existing "Explicitly out of
scope" section (ecommerce, analytics dashboards) with what this research
adds:

- **Live/interactive embedded product UI** (GrowthSync's animated chat-
  demo phone mockups, Supaste's live-looking app screenshot) — these are
  small interactive prototypes, not marketing content; no typed block
  should try to generalize this. If a user truly needs it, the `embed`
  block already provides a raw-HTML/iframe escape hatch.
- **Real checkout / dynamic pricing logic** (Supaste's device-count
  price recalculation, live "spots left" counter, Stripe checkout) —
  confirms the existing ecommerce-is-out-of-scope decision. A pricing
  *table* block (Tier 1) shows static tiers; it will never do live
  checkout.
- **Custom bespoke SVG/canvas data visualization** (Rareform's rotating
  radial wheel chart) — one-off, not a reusable pattern; use `embed` for
  custom SVG/HTML if a user needs something this specific.
- **Cursor-following hover image preview** (Karolina Hess) — niche,
  JS-heavy, low prevalence (1/13); `embed` covers it if truly needed.
- **Horizontal scroll-jacked galleries** — see Tier 3 above.
- **Per-word cursor tracking / parody interactive widgets** (Heretic's
  cookie-consent joke) — one-off brand flourishes, not durable block
  candidates.

## Phased plan

Each phase is scoped to land and verify cleanly (tsc/eslint/build clean,
checked live in the browser) before the next starts, matching how every
feature this session has already shipped was verified.

### Phase 1 — Tier 1 quick wins (accordion, video, marquee, pricing table, stat counter, image+overlay)

Highest prevalence-to-effort ratio; unlocks the single most requested
pattern (FAQ accordions, 7/13 sites) plus video, which currently has zero
support. All are self-contained new block types added to
`components/blocks/registry.tsx` — same file, same pattern as every block
added so far this session (Hero, offset positioning, animation field).

**Recommend building this phase directly (not parallelized)** — see
"Subagent feasibility" below for why.

### Phase 2 — Interactive blocks (list→content swap, before/after slider, comparison table)

Self-contained interactive components (client-side state lives inside one
block's own render, no new cross-block architecture needed). Independent
of Phase 1's files enough to parallelize if desired.

### Phase 3 — Motion upgrades (sticky positioning, scroll-scrubbed animation)

Cross-cutting: touches `BlockRenderer.tsx` and the shared animation
system (`lib/responsiveStyle.ts`/`ANIMATION_FIELD` in registry.tsx)
rather than adding isolated blocks. Do this *after* Phase 1's new blocks
exist, so the scroll-scrubbed mode can be verified against a realistic
mix of block types (video, marquee, etc.) rather than only the original
set.

### Phase 4 — Assets & branding (font upload, background texture)

Font upload touches the Media/asset-storage subsystem — architecturally
distinct from Phases 1–3's block work, safe to run in parallel with any
of them.

### Phase 5 — Content modeling (status badges, filterable tagged grids)

Extends Collections + `list`/`grid`, not new block types. Natural to do
after Phase 1 (so there's a finished `list`/`grid` badge-rendering
target) but architecturally independent of Phases 2–4.

### Security & architecture audit

Per `AGENTS.md`'s existing rule, still deferred until all roadmap work
(original roadmap + this plan) is complete — not run after each
individual phase.

## Subagent feasibility

**For research** (this document's own process): confirmed highly
effective. 4 parallel `general-purpose` agents, ~3 sites each, each using
WebFetch + the Browser tool, returned thorough, specific, cross-
referenced findings (including catching the scroll-scrubbed-vs-fire-once
distinction via actual script/DOM inspection, not just visual guessing)
in well under the time sequential research would have taken. **Recommend
the same pattern for any future multi-site or multi-target research.**

**For implementation**, mixed recommendation based on this session's
direct experience running 3 parallel worktree-isolated agents earlier
(Plugin SDK, Multilingual, Programmatic Access) and separately hitting a
painful multi-way merge when several smaller features all touched
`components/blocks/registry.tsx` in the same session:

- **Phase 1's six block types all add to the same file**
  (`registry.tsx`) — running them as parallel worktree agents would
  create a 6-way merge on one file, which is exactly the failure mode
  this project already hit once this session (small independent edits to
  a shared file are *worse* to parallelize than a few large,
  architecturally-separate features). **Build Phase 1 directly/
  sequentially in the main session**, not via subagents — each block is
  individually small enough that the overhead of worktree isolation and
  manual merge resolution would exceed the time saved.
- **Phases 3 and 4 are legitimately parallelizable** against each other
  and against Phase 1 (once Phase 1 lands) — they touch different
  subsystems (`BlockRenderer.tsx`/animation vs. Media/asset storage) with
  minimal file overlap, matching the shape of work that *did* parallelize
  cleanly earlier this session (Plugin SDK / Multilingual / Programmatic
  Access were each a distinct subsystem).
- **Phase 2 and Phase 5** are moderate-sized and self-contained enough
  that either direct work or a single isolated worktree agent per phase
  would work equally well — no strong recommendation either way.

**Bottom line**: parallelize across *phases/subsystems*, never across
*several small edits to the same file*. Use direct work for Phase 1;
consider worktree agents for Phases 3+4 running alongside each other
once Phase 1 is merged.
