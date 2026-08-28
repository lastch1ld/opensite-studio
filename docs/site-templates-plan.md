# Full site templates

The library of complete, multi-page site templates — one per genre, each a
cohesive set of pages sharing one palette, type system, nav and footer.
Not single isolated landing pages like `lib/pageTemplates.ts`'s starters.
All six genres are built; this doc is how they work, the bar they're held
to, and the lessons worth carrying into a seventh.

Structural reference for the hospitality genres was
`tourism-wix-generator`, a separate repo of hand-built Astro hotel
templates: its split hero, page-hero-for-subpages, alternating feature
rows, quote block and "explore tiles" grid. Mood references per genre are
in [reference-sites-research.md](reference-sites-research.md).

## The genres

| Genre | Pages | File |
|---|---|---|
| SaaS / tech product | Home, Features, Pricing, About, Contact | `lib/siteTemplates/saas.ts` |
| Agency / creative services | Home, Work, Services, About, Contact | `lib/siteTemplates/agency.ts` |
| Personal portfolio | Home, Work, About, Contact | `lib/siteTemplates/portfolio.ts` |
| Restaurant | Home, Menu, About, Contact/Reservations | `lib/siteTemplates/restaurant.ts` |
| Hotel | Home, Rooms, Amenities/Gallery, Contact/Book | `lib/siteTemplates/hotel.ts` |
| Bar | Home, Menu (drinks), Events, Contact | `lib/siteTemplates/bar.ts` |

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

**Still outstanding: the live-browser half.** None of the six has been
opened in the editor canvas and `/preview` on a running app, because this
machine has neither Docker nor a local Postgres. Everything a block tree
can be checked against is in CI; how a template actually lays out and
reads is not.

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
