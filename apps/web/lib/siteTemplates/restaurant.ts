import type { Block, PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";
import { mk, heading, body, cta, bleed } from "./_shared";

// Restaurant genre — docs/site-templates-plan.md Phase D.
// Palette: deep forest green (dark band + hero, the "vintage seal" register
// from docs/reference-sites-research.md's Banh Mi & You entry) + warm cream
// paper + a terracotta accent for prices/CTAs, with a small gold accent
// reserved for the seal mark and dietary tags — deliberately not SaaS's
// ink/indigo pairing. Fraunces (curated FONT_STACKS entry, editorial serif)
// carries headings for a food-photography-forward, handmade feel; Plus
// Jakarta Sans (rounded/humanist) carries body copy for the warm,
// walk-in/local register the reference site calls for. A lighter cut of
// tourism-wix-generator's structure per the plan doc: split hero + page-hero
// subpages, but no rooms/booking system — the Menu page uses the shipped
// "list" block (a static grid of item cards when no Collection is bound,
// see BlockRenderer.tsx's "list" branch) instead of an ordering system.
// All copy stays generic/placeholder — never a fabricated real dish, price,
// or review, per the existing convention in lib/pageTemplates.ts.
const RESTAURANT = {
  forest: "#1F3A2E",
  forestMuted: "#AFC3B3",
  cream: "#FBF3E7",
  paper: "#F3E7D3",
  text: "#241C15",
  textFaint: "#6E5F4F",
  terracotta: "#C1502E",
  gold: "#C79A3D",
  border: "#E4D8C3",
  fontDisplay: "fraunces",
  fontBody: "jakarta-sans",
} as const;

function pill(label: string, opts: { background: string; color: string }): Block {
  return mk("section", { layout: "stack" }, { background: opts.background, padding: "6px 14px", borderRadius: "999px", align: "center" }, [
    body(label, { size: "12px", weight: "700", color: opts.color, font: RESTAURANT.fontBody }),
  ]);
}

function restaurantSeal(): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: RESTAURANT.forest, padding: "12px 18px", borderRadius: "999px", align: "center", gap: "2px", borderColor: RESTAURANT.gold },
    [body("Est.", { size: "10px", weight: "700", color: RESTAURANT.gold, align: "center", font: RESTAURANT.fontBody }), body("Restaurant name", { size: "13px", weight: "700", color: RESTAURANT.cream, align: "center", font: RESTAURANT.fontDisplay })],
  );
}

function restaurantNav(active: string): Block {
  const links = ["Home", "Menu", "About", "Contact"];
  return mk(
    "section",
    { layout: "row" },
    { background: RESTAURANT.cream, padding: "16px 40px", justify: "space-between", align: "center", borderRadius: "0" },
    [
      restaurantSeal(),
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", gap: "6px", align: "center" },
        links.map((l) => pill(l, l === active ? { background: RESTAURANT.terracotta, color: "#ffffff" } : { background: "transparent", color: RESTAURANT.text })),
      ),
    ],
  );
}

function restaurantFooter(): Block {
  return bleed(
    RESTAURANT.forest,
    "56px 40px",
    [
      mk(
        "columns",
        { columns: "2" },
        { gap: "24px", align: "flex-start" },
        [
          mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "8px" }, [
            body("Restaurant name", { size: "16px", weight: "700", color: RESTAURANT.cream, font: RESTAURANT.fontDisplay }),
            body("Replace with an address.", { size: "13px", color: RESTAURANT.forestMuted }),
            body("Replace with opening hours.", { size: "13px", color: RESTAURANT.forestMuted }),
          ]),
          body("Replace with a real copyright line and social links.", { size: "13px", color: RESTAURANT.forestMuted, align: "right" }),
        ],
      ),
    ],
    "1100px",
    "0",
  );
}

// `eyebrow` param kept for call-site compatibility but no longer rendered
// as a kicker label — impeccable craft-floor bans it; the heading carries
// its own weight.
function restaurantPageHero(_eyebrow: string, title: string, sub: string): Block {
  return bleed(
    RESTAURANT.forest,
    "80px 40px 72px",
    [
      heading(title, { size: "42px", color: RESTAURANT.cream, align: "center", level: "h1", font: RESTAURANT.fontDisplay }),
      body(sub, { size: "17px", color: RESTAURANT.forestMuted, align: "center", font: RESTAURANT.fontBody }),
    ],
    "680px",
    "16px",
    { animation: "fade-in" },
  );
}

// Always dropped on a dark RESTAURANT.forest band — light values, not
// RESTAURANT.text/textFaint, or the numbers go near-invisible against the
// dark background (docs/site-templates-plan.md's checklist item 1).
function restaurantStatRow(stats: { value: string; suffix: string; label: string }[]): Block {
  return mk(
    "columns",
    { columns: String(stats.length) },
    { gap: "24px", animation: "fade-in" },
    stats.map((s) =>
      mk("statCounter", { value: s.value, prefix: "", suffix: s.suffix, label: s.label }, { valueColor: RESTAURANT.cream, valueFontSize: "38px", labelColor: RESTAURANT.forestMuted, align: "center" }),
    ),
  );
}

function pillarCard(title: string, copy: string): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: "#ffffff", padding: "28px", borderRadius: "16px", gap: "10px", align: "flex-start", borderColor: RESTAURANT.border, animation: "slide-up" },
    [heading(title, { size: "19px", color: RESTAURANT.text, font: RESTAURANT.fontDisplay }), body(copy, { size: "15px", color: RESTAURANT.textFaint, font: RESTAURANT.fontBody })],
  );
}

// A single guest quote reads as real hospitality social proof; a bare
// stat-counter (this genre's original home page had one — 2015/40+/90%,
// the last figure a unit-less number with no referent) is a B2B trust
// device that doesn't belong on a restaurant homepage.
function restaurantReview(quote: string, name: string): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: "transparent", padding: "0", gap: "14px", align: "center" },
    [
      heading(`“${quote}”`, { size: "26px", color: RESTAURANT.text, align: "center", font: RESTAURANT.fontDisplay, weight: "500" }),
      body(name, { size: "14px", color: RESTAURANT.textFaint, align: "center", font: RESTAURANT.fontBody }),
    ],
  );
}

// Hours and location are the single most-needed piece of information on a
// restaurant's homepage (the actual decision a walk-in/booking visitor is
// making) — the original home page had neither, only buried in the
// Contact-page sidebar.
function restaurantHoursLocation(): Block {
  return mk(
    "columns",
    { columns: "2" },
    { gap: "48px", align: "flex-start" },
    [
      mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "10px", align: "flex-start" }, [
        heading("Hours", { size: "20px", color: RESTAURANT.cream, font: RESTAURANT.fontDisplay }),
        body("Replace with days and hours, e.g. Tue–Sun, 5:30pm–10pm.", { size: "15px", color: RESTAURANT.forestMuted, font: RESTAURANT.fontBody }),
      ]),
      mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "10px", align: "flex-start" }, [
        heading("Find us", { size: "20px", color: RESTAURANT.cream, font: RESTAURANT.fontDisplay }),
        body("Replace with a street address.", { size: "15px", color: RESTAURANT.forestMuted, font: RESTAURANT.fontBody }),
        body("Replace with a phone number.", { size: "15px", color: RESTAURANT.forestMuted, font: RESTAURANT.fontBody }),
      ]),
    ],
  );
}

function menuItemCard(name: string, price: string, desc: string, tag?: string): Block {
  const header = mk("columns", { columns: "2" }, { gap: "8px", align: "center" }, [
    body(name, { size: "17px", weight: "700", color: RESTAURANT.text, font: RESTAURANT.fontDisplay }),
    body(price, { size: "16px", weight: "700", color: RESTAURANT.terracotta, align: "right", font: RESTAURANT.fontBody }),
  ]);
  const children: Block[] = [header, body(desc, { size: "14px", color: RESTAURANT.textFaint, font: RESTAURANT.fontBody })];
  if (tag) children.push(pill(tag, { background: RESTAURANT.gold, color: "#ffffff" }));
  return mk("section", { layout: "stack" }, { background: "#ffffff", padding: "20px", borderRadius: "14px", gap: "10px", align: "flex-start", borderColor: RESTAURANT.border, animation: "fade-in" }, children);
}

// Static grid of item cards via the shipped "list" block. With no
// collectionId bound, BlockRenderer.tsx's "list" branch still renders the
// child subtree once as a responsive CSS grid (matched items empty ->
// one static pass over `children`) — exactly the "menu-as-list-block, no
// booking/ordering system" shape docs/site-templates-plan.md's Phase D
// calls for, reusing the existing block instead of a bespoke component.
function menuCategory(title: string, items: Block[], background: string = RESTAURANT.cream): Block {
  return bleed(
    background,
    "64px 40px",
    [
      heading(title, { size: "28px", color: RESTAURANT.text, align: "center", font: RESTAURANT.fontDisplay }),
      mk("list", { collectionId: "", filterField: "", filterValue: "", filterTagField: "", sortField: "", sortDir: "asc", limit: "10", columns: "2" }, { gap: "20px", animation: "fade-in" }, items),
    ],
    "900px",
    "28px",
  );
}

export function restaurantHomeTemplate(): PageContent {
  const heroTextStack = mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "16px", align: "flex-start", animation: "slide-right" }, [
    heading("Replace with your restaurant's core promise — what people walk in for.", { size: "46px", color: RESTAURANT.cream, level: "h1", font: RESTAURANT.fontDisplay }),
    body("Replace with a sentence about the food, the room, or the neighborhood — what makes this the kind of place someone comes back to.", { size: "17px", color: RESTAURANT.forestMuted, font: RESTAURANT.fontBody }),
    mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "12px" }, [
      cta("View menu", { background: RESTAURANT.terracotta, color: "#ffffff" }),
      cta("Reserve a table", { background: "transparent", color: RESTAURANT.cream, variant: "secondary" }),
    ]),
  ]);
  const heroImage = mk("imageOverlay", { src: "https://placehold.co/700x800", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 5", borderRadius: "20px", animation: "slide-left" });
  // Plain solid forest — `bleed()`/`section`'s `background` style key maps
  // to CSS `background-color`, which cannot hold a gradient (a prior
  // pass's gradient here never actually rendered, caught on
  // re-inspection). No CSS-gradient depth needed regardless: this hero
  // already carries a real photo via `heroImage` (imageOverlay) in the
  // split layout below, which is where the visual interest should live.
  const hero = bleed(RESTAURANT.forest, "100px 40px 90px", [mk("columns", { columns: "2" }, { gap: "48px", align: "center" }, [heroTextStack, heroImage])], "1100px", "0");

  // Organic wave divider (embed block, per blocks-and-theming.md's framing
  // of `embed` as the lightweight one-off-custom-thing block) — a torn/
  // tablecloth-edge transition from the hero's forest field into the
  // white signature-dishes section below. Deliberately a different
  // decorative *mechanism* from SaaS's dot-grid or Agency's hard-edged
  // wedge — organic curves suit this genre, geometric ones don't.
  const waveDivider = mk(
    "embed",
    { html: `<style>body{margin:0}</style><svg viewBox="0 0 1440 80" preserveAspectRatio="none" style="width:100%;height:70px;display:block;"><path d="M0,0 L0,38 C240,74 480,8 720,34 C960,60 1200,14 1440,40 L1440,0 Z" fill="${RESTAURANT.forest}"/></svg>` },
    { height: "70px" },
  );

  const dishCard = (): Block =>
    mk(
      "section",
      { layout: "stack" },
      { background: "#ffffff", padding: "0", borderRadius: "16px", gap: "0", align: "flex-start", borderColor: RESTAURANT.border, animation: "slide-up" },
      [
        mk("imageOverlay", { src: "https://placehold.co/500x400", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 3", borderRadius: "16px 16px 0 0" }),
        mk("section", { layout: "stack" }, { background: "transparent", padding: "20px", gap: "6px", align: "flex-start" }, [
          heading("Replace with a dish name", { size: "18px", color: RESTAURANT.text, font: RESTAURANT.fontDisplay }),
          body("Replace with a short, honest description.", { size: "14px", color: RESTAURANT.textFaint, font: RESTAURANT.fontBody }),
        ]),
      ],
    );
  const signature = bleed(
    "#ffffff",
    "96px 40px",
    [
      heading("Replace with a signature-dishes headline", { size: "34px", color: RESTAURANT.text, align: "center", font: RESTAURANT.fontDisplay }),
      body("Replace with a sentence introducing what the kitchen is known for.", { size: "16px", color: RESTAURANT.textFaint, align: "center", font: RESTAURANT.fontBody }),
      mk("columns", { columns: "3" }, { gap: "24px" }, [dishCard(), dishCard(), dishCard()]),
    ],
    "1100px",
    "24px",
  );

  const review = bleed(
    RESTAURANT.paper,
    "88px 40px",
    [restaurantReview("Replace with a real guest review — one honest sentence about the food or the room.", "Replace with a name, or “Google review”")],
    "700px",
    "0",
  );

  const hoursLocation = bleed(RESTAURANT.forest, "72px 40px", [restaurantHoursLocation()], "800px", "0");

  const finalCta = bleed(
    RESTAURANT.terracotta,
    "72px 40px",
    [
      heading("Replace with a closing call to action", { size: "32px", color: "#ffffff", align: "center", font: RESTAURANT.fontDisplay }),
      body("Replace with a supporting sentence about walk-ins or reservations.", { size: "16px", color: "#FCE4D8", align: "center", font: RESTAURANT.fontBody }),
      cta("Reserve a table", { background: "#ffffff", color: RESTAURANT.terracotta }),
    ],
    "620px",
    "16px",
    { animation: "scale-in" },
  );

  return {
    version: 1,
    // Philosophy pillars stay unique to the About page (docs/site-templates-plan.md
    // feedback: a stat-counter row and a mission-statement pillar grid both read
    // as generic B2B homepage furniture here — a walk-in/booking visitor's
    // actual questions are "is the food good" (signature dishes, a real guest
    // review) and "when/where" (hours & location), not company stats.
    root: mk("section", { layout: "stack" }, { padding: "0", background: RESTAURANT.cream, gap: "0" }, [restaurantNav("Home"), hero, waveDivider, signature, review, hoursLocation, finalCta, restaurantFooter()]),
  };
}

export function restaurantMenuTemplate(): PageContent {
  const heroBlock = restaurantPageHero("Menu", "Replace with a menu-page headline", "Replace with a sentence about the kitchen's approach — seasonal, local, whatever's true.");

  const starters = menuCategory("Starters", [
    menuItemCard("Replace with a dish name", "$0", "Replace with a short, honest description."),
    menuItemCard("Replace with a dish name", "$0", "Replace with a short, honest description.", "Vegan"),
    menuItemCard("Replace with a dish name", "$0", "Replace with a short, honest description."),
  ]);

  const mains = menuCategory(
    "Mains",
    [
      menuItemCard("Replace with a dish name", "$0", "Replace with a short, honest description."),
      menuItemCard("Replace with a dish name", "$0", "Replace with a short, honest description."),
      menuItemCard("Replace with a dish name", "$0", "Replace with a short, honest description.", "Vegan"),
      menuItemCard("Replace with a dish name", "$0", "Replace with a short, honest description."),
    ],
    "#ffffff",
  );

  const drinks = menuCategory("Drinks", [
    menuItemCard("Replace with a drink name", "$0", "Replace with a short, honest description."),
    menuItemCard("Replace with a drink name", "$0", "Replace with a short, honest description."),
  ]);

  const note = bleed(RESTAURANT.paper, "40px 40px", [body("Replace with a note about allergens, substitutions, or a chef's-table option.", { size: "14px", color: RESTAURANT.textFaint, align: "center", font: RESTAURANT.fontBody })], "700px", "0");

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: RESTAURANT.cream, gap: "0" }, [restaurantNav("Menu"), heroBlock, starters, mains, drinks, note, restaurantFooter()]),
  };
}

type TeamSeed = { name: string; role: string };

export function restaurantAboutTemplate(): PageContent {
  const heroBlock = restaurantPageHero("About", "Replace with why this place exists", "Replace with two or three sentences about how it started — enough to build trust, not a full history.");

  const mission = bleed(
    "#ffffff",
    "80px 40px",
    [
      heading("Replace with your mission statement", { size: "28px", color: RESTAURANT.text, align: "center", font: RESTAURANT.fontDisplay }),
      body("Replace with a longer paragraph about how the kitchen sources, cooks, and serves.", { size: "17px", color: RESTAURANT.textFaint, align: "center", font: RESTAURANT.fontBody }),
    ],
    "700px",
    "16px",
  );

  const pillars = bleed(
    RESTAURANT.paper,
    "88px 40px",
    [
      heading("Our approach", { size: "30px", color: RESTAURANT.text, align: "center", font: RESTAURANT.fontDisplay }),
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        pillarCard("Replace with approach one", "Replace with a short paragraph."),
        pillarCard("Replace with approach two", "Replace with a short paragraph."),
        pillarCard("Replace with approach three", "Replace with a short paragraph."),
      ]),
    ],
    "1100px",
    "24px",
  );

  const stats = bleed(RESTAURANT.forest, "64px 40px", [restaurantStatRow([
    { value: "2015", suffix: "", label: "Founded" },
    { value: "28", suffix: "", label: "Seats" },
    { value: "12", suffix: "", label: "Local suppliers" },
  ])], "1000px", "0");

  const team: TeamSeed[] = [
    { name: "Replace with name 1", role: "Replace with a role" },
    { name: "Replace with name 2", role: "Replace with a role" },
    { name: "Replace with name 3", role: "Replace with a role" },
  ];
  const teamSection = bleed(
    "#ffffff",
    "88px 40px",
    [
      heading("The team", { size: "30px", color: RESTAURANT.text, align: "center", font: RESTAURANT.fontDisplay }),
      mk(
        "contentSwitcher",
        { items: team.map((t) => ({ id: randomUUID(), label: t.name, image: "https://placehold.co/600x750", description: t.role })) },
        { activeColor: RESTAURANT.text, inactiveColor: RESTAURANT.textFaint, imageAspectRatio: "4 / 5", animation: "fade-in" },
      ),
    ],
    "900px",
    "32px",
  );

  const finalCta = bleed(RESTAURANT.terracotta, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: "#ffffff", align: "center", font: RESTAURANT.fontDisplay }), cta("Reserve a table", { background: "#ffffff", color: RESTAURANT.terracotta })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: RESTAURANT.cream, gap: "0" }, [restaurantNav("About"), heroBlock, mission, pillars, stats, teamSection, finalCta, restaurantFooter()]),
  };
}

export function restaurantContactTemplate(): PageContent {
  const heroBlock = restaurantPageHero("Contact", "Replace with a reservations-page headline", "Replace with a sentence about walk-ins, reservations, or private events.");

  const formSection = bleed(
    "#ffffff",
    "72px 40px 96px",
    [
      mk(
        "columns",
        { columns: "2" },
        { gap: "56px", align: "flex-start" },
        [
          mk(
            "form",
            {
              fields: [
                { id: randomUUID(), type: "text", label: "Name", required: true },
                { id: randomUUID(), type: "email", label: "Email", required: true },
                { id: randomUUID(), type: "text", label: "Preferred date", required: false },
                { id: randomUUID(), type: "text", label: "Party size", required: false },
                { id: randomUUID(), type: "textarea", label: "Notes", required: false },
              ],
              submitLabel: "Request a table",
              onSubmit: { action: "storeOnly" },
            },
            { padding: "0" },
          ),
          mk("section", { layout: "stack" }, { background: RESTAURANT.paper, padding: "32px", borderRadius: "16px", gap: "16px" }, [
            heading("Visit us", { size: "20px", color: RESTAURANT.text, font: RESTAURANT.fontDisplay }),
            body("Replace with an address.", { size: "15px", color: RESTAURANT.textFaint, font: RESTAURANT.fontBody }),
            body("Replace with opening hours.", { size: "15px", color: RESTAURANT.textFaint, font: RESTAURANT.fontBody }),
            body("Replace with a phone number.", { size: "15px", color: RESTAURANT.textFaint, font: RESTAURANT.fontBody }),
          ]),
        ],
      ),
    ],
    "1000px",
    "0",
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: RESTAURANT.cream, gap: "0" }, [restaurantNav("Contact"), heroBlock, formSection, restaurantFooter()]),
  };
}
