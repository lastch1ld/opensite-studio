# Reference site research

Thirteen live sites, researched to inform `reference-sites-plan.md`'s gap
analysis. Each was pulled via WebFetch (HTML/CSS/DOM) and visually
inspected via the Browser tool (screenshots, scroll-through). Findings are
structural and technical, not aesthetic opinion — the goal is "what would
it take to build a page like this in OpenSite Studio's block system"
(section/hero/text/image/button/heading/spacer/columns/embed/list/form/
newsletter, each with a constrained style-field vocabulary, not arbitrary
CSS/HTML).

Research done via 4 parallel subagents (~3 sites each) — see
`reference-sites-plan.md`'s "Subagent feasibility" section for how that
went.

---

## 1. relief.pisapain.com — Pain Institute of Southern Arizona

**Genre**: local multi-location medical practice (interventional pain
management). Long-scroll direct-response lead-gen page, not a corporate
site — audience is older adults (50–70s) with chronic pain.

**Structure**: sticky header (logo/phone/CTA) → hero (full-bleed lifestyle
photo, star rating, headline, bullets, CTA) → sticky/fixed testimonial
strip that overlaps subsequent content while scrolling → problem
statement → 3-column differentiators → patient success quotes → 6-item
"why choose" grid + stat callout ("83,900+ patients/year") → 3-step
numbered process → physician credentials → guarantee statement → FAQ
accordion (8 items) → second testimonial block → final CTA band → footer.

**Visual**: cream/off-white (`#FFF7EC`), dark teal-green text, olive-green
CTA buttons, amber star icons. **Host Grotesk** (Google Font) throughout,
~50px rounded headline, 12px-radius buttons (soft, not pill).

**Distinctive patterns**: sticky/fixed testimonial band overlapping
scroll content; repeated CTA (7+ instances); FAQ accordion; "verified
patient" badge reused across two testimonial sections; large stat as its
own mini-hero.

**Complexity flags**: the fixed-position testimonial band overlapping
scrolling content is a nonstandard layering trick. Otherwise this is one
of the **most block-CMS-friendly** sites in the set — mostly a stack of
section/text/testimonial/FAQ/button blocks, standard 2–3 col grids, no
video/canvas/maps/e-commerce.

---

## 2. growthsync.com — GrowthSync

**Genre**: B2B SaaS (AI social-commerce automation — turns Instagram
comments/DMs into sales). Audience: DTC/e-commerce marketers. Heavy
"show, don't tell" product-demo marketing.

**Structure**: sticky header → hero (two-tone headline, animated phone
mockup, "40M Views" stat that repeats/marquees) → logo strip (marquee) →
**pinned scroll section**: phone mockup stays fixed left while 3 numbered
feature blurbs scroll past right, with a progress-line indicator and the
phone's on-screen content changing in sync with scroll position → 8
clickable use-case cards driving a live animated DM-conversation mockup →
AI-chat dashboard mockup with typewriter-effect input → full-bleed black
CTA band → FAQ accordion (5 items) → secondary hero w/ staggered phone
mockups → footer with oversized bleeding wordmark on orange gradient.

**Visual**: blush/peach background, black text, vivid orange accent.
**Hanken Grotesk** (600 weight headlines) paired with an italic-serif
accent treatment for emphasis words mid-headline ("revenue," "social
commerce").

**Distinctive patterns**: realistic iPhone-frame mockups with live
animated faux-UI (chat bubbles, typing indicators); **scroll-linked
pinned section** where a fixed visual's content changes based on scroll
position, synced to a numbered progress list; clickable card → content
swap; marquee stat/logo strip; oversized bleeding footer typography;
mixed serif-italic/sans-bold pairing for emphasis.

**Complexity flags** (highest in the set): scroll-linked pinned sections
with synchronized multi-state content changes need continuous scroll-
position tracking driving both layout and content swap — categorically
different from a fire-once "fade in on scroll" trigger. Realistic
device-frame mockups with simulated live UI are effectively small
interactive prototypes — not a reasonable target for typed blocks.
Auto-playing timed chat sequences need custom animation choreography.
Interactive card-driven content switching needs cross-block state.
Marquees need continuous-scroll CSS/JS. Bleeding/overflowing typography
needs precise overflow/negative-margin control. Mid-sentence font-family
switching needs inline (not block-level) rich text.

---

## 3. rareformhealth.co — Rareform

**Genre**: premium direct-pay longevity/concierge healthcare membership
(à la Fountain Life, Superpower). Audience: affluent health-optimization
adults. Premium wellness-editorial tone, not clinical.

**Structure**: sticky header → hero (full-bleed athletic photo, gradient
overlay, 3-card info row overlapping the photo) → problem statement →
**accordion-style 4-step process** (step 1 expanded w/ a live-data
overlay card "VO2Max 55 ml/kg/min", steps 2–4 collapsed as colored pill
rows) → 2-column feature list (10 items, custom line icons, staggered
scroll-fade) → **custom rotating SVG radial/wheel chart** synced to
scroll, with rotating circumference labels → 3-card photo grid
(gradient-overlay captions) → team section → **6 stat cards with
count-up-on-scroll numbers** → 3-column comparison table (Rareform vs.
Traditional Care vs. Diagnostics, middle column visually elevated) →
3-tier pricing (cards over a **parallax photo background** — cards pinned
while photo scrolls independently) → FAQ (3 items) → final CTA → footer
w/ oversized bleeding wordmark.

**Visual**: cream/tan (`~#F5EAD9`), deep forest green (`~#0F3D34`),
coral-red CTA (distinct from brand green), gold divider accents. **Sharphy
Light** (custom/licensed font, weight 300) — light, rounded, geometric,
elegant rather than bold-SaaS.

**Complexity flags**: custom SVG rotating radial chart with scroll-linked
rotation is bespoke data-viz — not a reasonable generic block, use an
embed/custom-HTML escape hatch instead. Count-up number animation needs
JS numeric interpolation (moderate — Motion, already a dependency,
supports this natively). Parallax pinned-cards-over-scrolling-photo needs
independent scroll speeds. The comparison table has asymmetric per-column
styling (one column visually "elevated") beyond a plain N-even-column
grid. Accordion steps have per-item conditional coloring. Licensed custom
font needs file upload, not a Google Fonts pick. Gradient-overlay photo
captions are a compound treatment (image + scrim + positioned text), not
a plain image block.

---

## 4. wishlabs.ai — Wishlabs

**Genre**: corporate brand site for an AI consumer-app portfolio company
(viral photo/AI-art apps). Audience: recruits, press, investors — a
B2B/B2Talent brand site, not a purchase funnel.

**Structure**: nav (logo + Products/Jobs) → hero (giant wordmark filled
with a photographic cloudscape image, 7 partner-app logo row) → 3-stat
strip ("150M+ downloads") → bold value-prop statement → abstract
philosophy taglines → product spotlight w/ **before/after image
comparison slider** → 4-card product grid → 2-column capabilities → 5
testimonial quotes (one **repeats 5×** — an infinite/looping carousel) →
jobs grid (6 cards) → footer.

**Visual**: cream background, deep navy-purple/periwinkle/lavender/pink
accents, near-black dark sections. **5+ font families** detected across
text layers (Satoshi, DM Sans, Inter, Lato, a custom bold face) — each
text block apparently carries its own font rather than one locked pairing
(a Framer-authoring artifact, not necessarily an intentional system).

**Distinctive patterns**: giant text-as-graphic hero (wordmark filled
with a photo/gradient, i.e. a text-image mask); before/after slider;
sibling-product icon row; staggered scroll-reveal; looping testimonial
carousel; one `<video>` element.

**Complexity flags**: text-mask/knockout hero (image showing "through"
letters) needs a mask/clip-path capability outside typical style fields.
Before/after slider needs a dedicated interactive block. Per-text-block
font override (5+ families on one page) is a materially looser model than
a locked theme-font pairing. Staggered (not just uniform) reveal timing
across many children. Testimonial carousel needs a dedicated block.

---

## 5. heretic.wtf — Heretic

**Genre**: independent creative/branding agency (Web3, DTC, gaming
clients). Audience: brand clients wanting a "rebellious" creative
partner. High-personality B2B services site.

**Structure**: nav (blackletter wordmark, contact + "Book a call") →
hero (huge blackletter headline "Burn the Playbook" over black, photoreal
3D rally car with a **ground-reflection effect**) → parody
cookie-consent widget as a branded joke UI → manifesto copy → services
tag list → **looping/marquee testimonial ticker** (quotes repeat 3× in
DOM) → 5 case-study write-ups separated by full-bleed solid-color section
breaks (**7 `<video>` elements** total — likely hover-preview/autoplay
reels) → footer styled as a dictionary entry ("her·e·tic (ˈhɛr ɪ tɪk)
n. …").

**Visual**: near-black, gold/amber accent (`#FFBA24`), warm olive-black
section breaks. **Misfits Blackletter** (gothic/metal display face) for
the hero, paired with clean Helvetica Neue body — high-contrast, edgy
pairing.

**Complexity flags**: custom blackletter webfont needs file upload.
Photoreal 3D product shot with reflection is fine as a static image
asset, but a *live* CSS reflection effect (mask-image gradient) isn't a
typical style field. 7 videos tied to case studies need a proper video
block (autoplay/loop/muted, maybe hover-to-play). Infinite marquee
ticker needs continuous-scroll animation. The parody cookie-widget is a
fully custom interactive component — no reasonable typed-block target,
would need a custom-HTML escape hatch. Full-bleed alternating
solid-color section breaks ARE reproducible today (section + background
color).

---

## 6. supaste.com — Supaste

**Genre**: indie macOS clipboard-manager app. Classic self-serve
indie-SaaS funnel: hero → feature walkthrough → pricing → FAQ.

**Structure**: nav that becomes a **floating black pill "Dock"-style bar**
on scroll → hero (macOS Sonoma wallpaper background, live-looking product
UI mockup w/ search bar + category tiles + timestamped entries) →
feature-tag strip (12 tags) → several feature deep-dives, most paired
with a short autoplay demo video (**10 `<video>` elements** total) → 6
persona-card use-case grid → pricing (single card, device-count selector
recalculating price, "5 spots left" urgency badge, strikethrough
early-bird price, real Stripe/Polar.sh checkout) → **~15-item FAQ
accordion** → cross-sell module for a sister product → press-badge strip
→ footer with a repeated mini-hero and an 8-product "maker network" link
list.

**Visual**: white background, macOS-system blue (`#0080FF`) accent,
light-gray cards. **Inter Display** for headlines/UI, **Instrument
Serif** as a per-word accent face inside headlines (indie-SaaS trend:
serif-for-emphasis), plain Inter body.

**Complexity flags**: 10 autoplay/looping product-demo videos need real
video block support (and the actual footage isn't something a CMS can
generate, only host). The live-looking hero product mockup, if truly
interactive rather than a static image, is a small embedded prototype —
out of scope. **Dynamic pricing** (device-selector recalculating price,
live "spots left" counter, real checkout) is genuine e-commerce/checkout
logic — already explicitly out of scope for this project (see
`docs/roadmap.md`'s "Explicitly out of scope" section) and this
confirms that boundary is right; a pricing-table *block* can show static
tiers, never live checkout. Scroll-morphing sticky nav (bar → floating
pill) is a specific transform, not a plain sticky toggle. ~15-item FAQ
accordion — same accordion need as elsewhere. Mid-headline serif/sans
per-word switching needs inline rich text.

---

## 7. nkora.co.uk — NKORA

**Genre**: specialty coffee shop chain (8 London-area locations).
Moody, editorial "quiet luxury" hospitality branding; also a barista
recruiting page.

**Structure**: fixed nav → full-bleed hero (latte-art photo, huge
headline "CONSIDERED CUPS", pill CTA) → about strip → **pinned
scroll-jacked horizontal gallery**: normal vertical scroll drives
horizontal panning through a long strip of location photography (~3,000–
4,000px of scroll height for one section) → roaster partnership blurb →
3-word brand-pillar strip (HUMAN / INDEPENDENT / CRAFTED) → recruitment
section → dual CTA → footer.

**Visual**: near-black warm brown (`#24201A`), cream/pale-yellow pill
buttons and headline text, warm coffee-toned photography. Custom/bespoke
**"NKORA V4"** display font (not a Google Font) at 80px, all-caps body
and nav throughout.

**Complexity flags**: the **pinned horizontal-scroll-jacked gallery** is
the standout hard feature — vertical scroll converted to horizontal pan
via scroll-position pinning (GSAP ScrollTrigger–style). Fundamentally
incompatible with a simple fade/slide-on-scroll primitive; this is the
single hardest, most bespoke pattern across all 13 sites and the
**lowest-prevalence** one (1 of 13) — a strong candidate to explicitly
defer/decline rather than build a generic primitive for it. Custom
bespoke font needs upload. Tight art-directed image crop with overlaid
text suggests custom positioning beyond simple padding/align (partially
covered by the offset-positioning feature already built).

---

## 8. mosaic.select — Mosaic (by Huehaus)

**Genre**: daily-curated web-design inspiration directory (Awwwards/
Land-book-style), run by agency Huehaus as a lead-gen/portfolio tool.
Domain confirmed live and functional (`.select` TLD, not parked).

**Structure**: nav (Categories/About/Partnership/Templates/Tools/Submit/
Newsletter, light/dark toggle) → hero (headline + a "Site of the Week"
featured card w/ image/video + oversized overlaid type) → **sticky
category filter bar** (18 tags: Agency/Animations/Bold Type/Business/
Colourful/Ecommerce/Editorial/F&B/Grid/Minimal/Portfolio/Template/
Technology/Light Mode/Dark Mode/Storytelling/…) → **masonry card grid**,
dozens of entries, each a thumbnail + name + category tag(s); cards
render as solid-color placeholders before the real screenshot resolves
(deliberate skeleton-loading, matching each entry's dominant color) →
effectively **infinite scroll** (page height far exceeds the tested
scroll depth, no footer/pagination reached) → fixed scroll-to-top button.

**Visual**: dark mode by default (`#121212`), white text, colorful
per-entry accent thumbnails. Google Fonts sans body, bold grotesk hero,
condensed/mono-ish display face for the featured-card overlay.

**Complexity flags**: **client-side category filtering** across a large
tagged dataset needs a real filter/query mechanism bound to structured
tag metadata — a materially different content model than a static block
tree (closer to this project's existing Collections system, which
already supports typed fields — filtering UI on top of a Collection is
the natural fit, not a new block primitive). **Infinite scroll/lazy
pagination** of a large collection needs a data-driven paginated list,
not a fixed manually-placed block set. Dominant-color-placeholder →
image-fade-in loading is a nice progressive-image technique, moderate
effort. Light/dark theme toggle needs a token-based theme system (this
project already has one — Theme tokens — worth checking whether toggling
between two theme variants at runtime is supported or would need
extending). The "Site of the Week" module is an asymmetric composite
hero+card layout, not a single simple hero.

---

## 9. karolinahess.com — Karolina Hess

**Genre**: personal portfolio for a freelance Framer/no-code web
designer. Audience: prospective agency/startup clients. High-end,
confident, minimal.

**Structure**: floating nav (persistent circular "Quick info" side-tab) →
hero (huge two-line headline "Creative Web Designer" at 140px, faint
background portrait) → statement section w/ **word-level bold/color
emphasis inside running sentences** + "PLAY REEL" video-trigger button →
small horizontal "recent works" thumbnail row → **sticky/pinned full-
viewport CTA footer** that reveals as the page finishes scrolling → (on
`/works`) a numbered project index list, each row apparently paired with
a **hover-triggered cursor-following image preview**.

**Visual**: warm light-gray (`#E9E8E8`), charcoal text, deep forest
green (`#1A5241`) CTA sections. **Neue Montreal** (well-known
contemporary grotesk) at large display sizes, paired with a smaller
sans for body/nav.

**Complexity flags**: **inline word-level text styling** (specific words
bolded/recolored within one sentence) needs real rich text, not block-
level style fields — this is a recurring theme across the set (also
Wishlabs, GrowthSync, Supaste). **Sticky/pinned footer reveal** is the
same scroll-position-pinning pattern as NKORA/GrowthSync, just applied
to a footer instead of a gallery/demo. **Hover-triggered cursor-following
image preview** needs custom mousemove-tracking JS — niche, low ROI for
a generic block. Persistent floating "Quick info" panel is a custom
overlay/drawer component. Video-trigger button implies modal/lightbox
support paired with a video block.

---

## 10. accoutrementtours.com.au — Accoutrement Tours

**Genre**: boutique/luxury chef-led culinary tour operator. Audience:
affluent food-and-travel travelers. Lead-gen (register interest →
sales conversation), not self-serve checkout.

**Structure**: nav → hero (full-bleed photo, serif headline "Travel the
world with taste") → about intro → 5-image gallery strip → manifesto
statement block → **tour listing** (row-based, not cards: thumbnail +
availability-status badge overlay ["Sold Out" / "Only 1 Room Left"] +
date + title + description + arrow link, 5 rows) → register CTA →
**curators section**: interactive name list where clicking/hovering a
name swaps a single displayed portrait (tab-like interaction), 10
chefs → testimonials styled as **tilted "handwritten note" cards**
(custom script font, colored borders, CSS rotation) → **tilted
overlapping photo-collage** register CTA → **FAQ accordion** (10 items)
→ newsletter teaser w/ illustrated sticky-note graphic → footer.

**Visual**: cream, pale powder-blue, bright coral-orange and yellow
full-bleed color-block sections, black text. Large display serif
("Feature Deck Trial") for all headlines, editorial/fashion-magazine
feel.

**Complexity flags**: the **hover/click-driven curator image-swap** is
genuine state-linked interactivity (list item → displayed image), not a
style property — needs a dedicated interactive block. **Tilted/rotated
photo cards and collages** need arbitrary per-image CSS rotation/offset
— a "scattered gallery" block variant would cover this. The
**availability-status badge** on tour thumbnails is structured per-item
data (an enum: available/limited/sold-out) — this maps naturally onto
the existing Collections system (a tour Collection with a status field)
rather than needing a new block type. Custom script/handwriting webfont
needs upload. Otherwise: row-list, FAQ accordion, and color-block
sections map well to existing/planned block types.

---

## 11. keitimas.domenicogriffo.com — "Keitimas" (Harmonix 2.0 template)

**Genre**: life/career/mindset coaching personal brand (a Framer
template, "Harmonix 2.0 Life Coach," rebranded). Audience: professionals
seeking executive/life coaching.

**Structure**: sticky floating pill nav over an illustrated landscape
hero → about → 4-step process (Define Vision / Map the Way / Act with
Confidence / Reflect & Elevate) → 3 service cards → **success-stories
section whose content repeats in the DOM** (looping testimonial marquee)
w/ named clients + % outcome stats → **numbered FAQ accordion** (001–006)
→ blog grid (5 cards) → closing CTA → footer.

**Visual**: light neutral gray, warm illustrated (painterly, not
photographic) sunset-mountain hero art. **Instrument Serif** headlines +
**Instrument Sans** body — a refined serif/sans pairing.

**Complexity flags**: custom illustrated hero art is just an asset (a
plain background-image field suffices functionally, even if the specific
bespoke illustration isn't reproducible). Looping testimonial marquee —
same recurring need as several other sites. **Confirmed via DOM/script
inspection**: this is Framer's continuous scroll-progress-linked motion
(`useScroll`/`useTransform`, elements initialized at `opacity: 0.001` and
only resolving mid-scroll-gesture) — not a fire-once "animate on scroll
into view" trigger. This is the clearest technical confirmation (not
just visual impression) that several sites in this set rely on
**scroll-scrubbed** animation, categorically different from the existing
one-shot Motion `whileInView` animation already in OpenSite Studio.

---

## 12. metier.domenicogriffo.com — "Métier"

**Genre**: personal portfolio for a freelance brand-identity designer/
art director targeting fashion/beauty clients. B2B creative-services
sales page.

**Structure**: minimal nav (logo + hamburger, no visible text links) →
**split 50/50 hero**: bold headline + CTA on a paper-grain-textured
panel, full-bleed portrait photo on the other half, with the **image
staying visually pinned while the text/subsequent sections scroll past
it** → about → 3-tier services + contact card → 4-step process → project
gallery → 7 testimonial cards (each with a **date stamp**, an unusually
specific field) → FAQ (5 items) → footer.

**Visual**: near-monochrome — light gray/off-white, black text/buttons,
warm portrait photography as the only color accent. **League Spartan**
used for both headings and body (one bold grotesque throughout) — a
confident, minimal, single-family system. Paper-grain/noise texture
overlay on light panels.

**Complexity flags**: this is the **clearest confirmed case of
scroll-linked motion** in the set — JS introspection found real DOM
content sitting at its expected scroll offset but not visually rendering
even after an instant `scrollTo()` jump, only resolving during a smooth
scroll gesture (Framer's scroll-progress-driven opacity/transform). The
**sticky/pinned split-hero image** needs `position: sticky` + z-index/
layering, not expressible with plain padding/gap/column-count fields.
Paper-grain texture is a raster/CSS-filter background effect, outside a
plain background-color property — a low-effort "background texture"
style option would cover this cheaply. Per-testimonial date stamp is
just an extra text field, trivial.

---

## 13. banhmiandyou.com — Banh Mi & You

**Genre**: Vietnamese sandwich/specialty-matcha café in Hamburg
(German-language). Local, walk-in/social-driven audience. Menu +
brand-storytelling, not online ordering.

**Structure**: nav (circular vintage-seal logo, pill nav buttons sitting
directly on the hero photo) → hero (full-bleed food photo, oversized
3-line wordmark overlapping the image, cookie-consent banner mentioning
Google Maps usage) → signature menu section (4 items + prices, one
tagged "vegan") → matcha/drinks section (3 one-word value props) → brand
philosophy (3 pillars) → Instagram callout → footer (address, hours,
"Website by Kyne" credit).

**Visual**: dark forest green (tiled hero backdrop) + warm cream
(`#FEF5E9`) + natural food-photo accent colors. **Bricolage Grotesque**
(chunky contemporary display sans) oversized for the hero wordmark.

**Complexity flags**: large-scale display type deliberately overlapping/
integrated into the hero photo (precise compositional layering, not just
a caption) needs a block supporting absolute/layered text-over-image
placement — partially covered by existing offset-positioning, worth
verifying it's sufficient for this exact pattern. Per-menu-item dietary
tag ("vegan") is a small structured-data need — a Collection field or a
"badge" option on list items, not a new block type. Google Maps embed
(implied by the cookie banner) is already covered by the existing Embed
block (iframe) — no new capability needed, just confirms embed covers
this use case. Same Framer scroll-scrubbed-motion caveat as sites 11–12
(confirmed via the same `opacity: 0.001` initial-state script pattern).

---

## Cross-cutting patterns (tally across all 13 sites)

| Pattern | Sites | Count |
|---|---|---|
| Scroll-scrubbed / pinned motion (not fire-once fade-in) | GrowthSync, Rareform, NKORA, Karolina Hess, Métier, Keitimas, Banh Mi & You | 7 |
| FAQ / accordion | relief.pisapain, GrowthSync, Rareform, Supaste, Accoutrement, Keitimas, Métier | 7 |
| Looping marquee/carousel (testimonials, logos, stats) | Wishlabs, Heretic, Supaste (implied), Keitimas, GrowthSync | 5 |
| Video as first-class content | Wishlabs, Heretic (7), Supaste (10), Karolina Hess | 4 |
| Custom/licensed (non-Google-Fonts) display font | NKORA, Rareform, Heretic, Karolina Hess (arguably), Accoutrement | 5 |
| Inline / word-level rich text emphasis | Wishlabs, GrowthSync, Supaste, Karolina Hess | 4 |
| Image + gradient-overlay caption compound | Rareform, GrowthSync (mockups) | 2+ |
| Interactive list → content swap (tabs-like) | Accoutrement (curators), GrowthSync (use-case cards) | 2 |
| Pricing / comparison table | Supaste, Rareform | 2 |
| Animated count-up stats | Rareform | 1 |
| Before/after image slider | Wishlabs | 1 |
| Horizontal scroll-jacked gallery | NKORA | 1 |
| Structured status/tag data (availability, dietary) | Accoutrement, Banh Mi & You | 2 |
| Client-side filterable/tagged collection grid | Mosaic | 1 |
| Live/interactive embedded product UI | GrowthSync, Supaste | 2 |
| Real checkout / dynamic pricing | Supaste | 1 (already out of scope) |
| Custom bespoke SVG/canvas data-viz | Rareform | 1 |
| Map embed | Banh Mi & You | 1 (already covered by Embed block) |

See `reference-sites-plan.md` for what this means for OpenSite Studio's
block system, in priority order.
