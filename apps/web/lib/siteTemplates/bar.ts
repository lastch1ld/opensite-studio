import type { Block, PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";
import { mk, heading, body, cta, bleed, badge } from "./_shared";

// Bar / nightlife genre — docs/site-templates-plan.md Phase F.
// Palette: near-black warm brown (not SaaS's blue-black ink) + a single
// amber/copper accent, deliberately dark-heavy end to end — distinct from
// Hotel's cooler stone/ice restraint and Restaurant's warmer palette.
// Mood reference: docs/reference-sites-research.md's NKORA entry (moody
// editorial "quiet luxury" hospitality branding, all-caps display type,
// near-black warm-brown base) adapted from coffee-shop into a nightlife
// register — NOT its pinned scroll-jacked horizontal gallery, which that
// same doc flags as incompatible with this project's fade/slide animation
// primitive; ambience photography here uses a plain `columns` grid of
// `imageOverlay` blocks instead. Instrument Serif carries the editorial
// headline voice; IBM Plex Mono (uppercase copy) plays the "menu chit"/
// nightlife-signage utility role for eyebrows and nav labels.
//
// The `list` block (docs/blocks-and-theming.md) only repeats its children
// once per bound CollectionItem — with no collectionId it renders exactly
// one pass of all children in a single grid cell, not a multi-item grid.
// Since this template has no live Collection to bind against, the drink
// menu and event cards below use `columns` (the same static-grid pattern
// `saas.ts` already uses for its feature cards), not `list` — noted here
// per AGENTS.md's "implement the reasonable interpretation and say so"
// rule rather than shipping a menu that only renders one item.
const BAR = {
  ink: "#110C09",
  inkPanel: "#1E1611",
  panelBorder: "#33261A",
  cream: "#F4EAD9",
  creamFaint: "#B5A491",
  accent: "#CD9A4A",
  accentDeep: "#7A2331",
  font: "instrument-serif",
  labelFont: "plex-mono",
} as const;

function barNav(active: string): Block {
  const links = ["HOME", "MENU", "EVENTS", "CONTACT"];
  return mk(
    "section",
    { layout: "row" },
    { background: BAR.ink, padding: "22px 40px", justify: "space-between", align: "center", borderRadius: "0" },
    [
      body("THE HIDEOUT", { size: "15px", weight: "700", color: BAR.cream, font: BAR.labelFont }),
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", gap: "28px", align: "center" },
        links.map((l) => body(l, { size: "13px", weight: l === active ? "700" : "400", color: l === active ? BAR.accent : BAR.creamFaint, font: BAR.labelFont })),
      ),
    ],
  );
}

function barFooter(): Block {
  return bleed(
    BAR.ink,
    "56px 40px",
    [
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", justify: "space-between", align: "center" },
        [
          body("THE HIDEOUT", { size: "14px", weight: "700", color: BAR.cream, font: BAR.labelFont }),
          body("Replace with a real address, hours, and copyright line.", { size: "13px", color: BAR.creamFaint }),
        ],
      ),
    ],
    "1100px",
    "0",
  );
}

// `eyebrow` param kept for call-site compatibility but no longer rendered
// as a kicker label — impeccable craft-floor bans it outright.
function barPageHero(_eyebrow: string, title: string, sub: string): Block {
  return bleed(
    BAR.ink,
    "80px 40px 72px",
    [
      heading(title, { size: "46px", color: BAR.cream, align: "center", level: "h1", font: BAR.font }),
      body(sub, { size: "17px", color: BAR.creamFaint, align: "center" }),
    ],
    "680px",
    "16px",
  );
}

function barPressMarquee(): Block {
  const names = ["Publication A", "Publication B", "Publication C", "Publication D", "Publication E"];
  return mk(
    "marquee",
    { speed: "26", direction: "left", pauseOnHover: "true" },
    { gap: "56px" },
    names.map((n) => body(n, { size: "16px", weight: "600", color: BAR.creamFaint, font: BAR.labelFont })),
  );
}

// "What's on tonight" is the actual reason a bar homepage visitor is
// there — a founding-year/drink-count/nights-open stat-counter row (the
// original home page's choice) is a SaaS credibility widget, not what a
// nightlife visitor is scanning for.
function barEventSpotlight(date: string, title: string, blurb: string): Block {
  return mk(
    "columns",
    { columns: "2" },
    { gap: "40px", align: "center" },
    [
      mk("imageOverlay", { src: "https://placehold.co/700x500", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0.1", aspectRatio: "4 / 3", borderRadius: "4px", animation: "slide-right" }),
      mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "12px", align: "flex-start", animation: "slide-left" }, [
        body(date, { size: "13px", weight: "700", color: BAR.accent, font: BAR.labelFont }),
        heading(title, { size: "28px", color: BAR.cream, font: BAR.font }),
        body(blurb, { size: "15px", color: BAR.creamFaint }),
        cta("See all events", { background: BAR.accent, color: BAR.ink }),
      ]),
    ],
  );
}

// Hours and location are the missing practical information a bar
// homepage needs — the original had neither.
function barHoursLocation(): Block {
  return mk(
    "columns",
    { columns: "2" },
    { gap: "48px", align: "flex-start" },
    [
      mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "10px", align: "flex-start" }, [
        heading("Hours", { size: "18px", color: BAR.cream, font: BAR.font }),
        body("Replace with days and hours, e.g. Wed–Sat, 6pm–2am.", { size: "15px", color: BAR.creamFaint }),
      ]),
      mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "10px", align: "flex-start" }, [
        heading("Find us", { size: "18px", color: BAR.cream, font: BAR.font }),
        body("Replace with a street address.", { size: "15px", color: BAR.creamFaint }),
      ]),
    ],
  );
}

type DrinkSeed = { name: string; desc: string; price: string };

function barDrinkCard(d: DrinkSeed): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: BAR.inkPanel, padding: "28px", borderRadius: "4px", gap: "10px", align: "flex-start", borderColor: BAR.panelBorder, animation: "slide-up" },
    [
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", justify: "space-between", align: "center" }, [
        heading(d.name, { size: "20px", color: BAR.cream, font: BAR.font, level: "h3" }),
        body(d.price, { size: "16px", weight: "700", color: BAR.accent, font: BAR.labelFont }),
      ]),
      body(d.desc, { size: "14px", color: BAR.creamFaint }),
    ],
  );
}

function barDrinkGrid(drinks: DrinkSeed[]): Block {
  return mk("columns", { columns: "3" }, { gap: "20px" }, drinks.map(barDrinkCard));
}

export function barHomeTemplate(): PageContent {
  // Real `hero` block with a real backgroundImage (a room/atmosphere
  // photo) — not a hand-rolled bleed() with a CSS neon-squiggle data-URI.
  // `section`'s `background` style key maps to CSS `background-color`,
  // which cannot hold a url() at all — a prior pass's neon-squiggle
  // background-image trick through `bleed()` never actually rendered,
  // caught on re-inspection. `hero`'s own `backgroundImage` prop
  // composites the photo with a built-in dark scrim for legible text —
  // a real room photo suits this genre's nightlife register better than
  // any decorative SVG standing in for one. No eyebrow label (impeccable
  // craft-floor) — "a cocktail bar" now reads through the copy itself.
  const hero = mk(
    "hero",
    { backgroundImage: "https://placehold.co/1800x1200/110C09/CD9A4A?text=" },
    { background: BAR.ink, padding: "130px 40px 100px", contentWidth: "760px", align: "center", gap: "22px", backgroundTexture: "grain" },
    [
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "10px", justify: "center" }, [
        badge("★ 4.8 · 300+ reviews", { tone: "warning" }),
        badge("Open since 2016", { tone: "neutral" }),
      ]),
      heading("Replace with your bar's core promise — the room, the drinks, the night.", { size: "62px", color: BAR.cream, align: "center", level: "h1", font: BAR.font, animation: "slide-up" }),
      body("Replace with a supporting sentence about the atmosphere and who this room is for.", { size: "18px", color: BAR.creamFaint, align: "center" }),
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "12px", justify: "center", animation: "fade-in" }, [
        cta("Reserve a table", { background: BAR.accent, color: BAR.ink }),
        cta("View the menu", { background: "transparent", color: BAR.cream, variant: "secondary" }),
      ]),
    ],
  );

  const pillars = bleed(
    BAR.inkPanel,
    "56px 40px",
    [
      mk(
        "columns",
        { columns: "3" },
        { gap: "24px", animation: "fade-in" },
        [
          body("UNHURRIED", { size: "15px", weight: "700", color: BAR.cream, align: "center", font: BAR.labelFont }),
          body("HANDCRAFTED", { size: "15px", weight: "700", color: BAR.cream, align: "center", font: BAR.labelFont }),
          body("AFTER DARK", { size: "15px", weight: "700", color: BAR.cream, align: "center", font: BAR.labelFont }),
        ],
      ),
    ],
    "900px",
    "0",
  );

  const ambience = bleed(
    BAR.ink,
    "96px 40px",
    [
      heading("The room", { size: "34px", color: BAR.cream, align: "center", font: BAR.font }),
      body("Replace with a sentence about the space — lighting, materials, the feel of it.", { size: "16px", color: BAR.creamFaint, align: "center" }),
      mk(
        "columns",
        { columns: "3" },
        { gap: "16px", animation: "fade-in" },
        [
          mk("imageOverlay", { src: "https://placehold.co/700x900", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0.15", aspectRatio: "4 / 5", borderRadius: "4px" }),
          mk("imageOverlay", { src: "https://placehold.co/700x900", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0.15", aspectRatio: "4 / 5", borderRadius: "4px" }),
          mk("imageOverlay", { src: "https://placehold.co/700x900", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0.15", aspectRatio: "4 / 5", borderRadius: "4px" }),
        ],
      ),
    ],
    "1100px",
    "24px",
  );

  const eventSpotlight = bleed(
    BAR.inkPanel,
    "88px 40px",
    [barEventSpotlight("Replace with a date", "Replace with tonight/this week's event name", "Replace with a one-line description of what's happening.")],
    "1000px",
    "0",
  );

  const hoursLocation = bleed(BAR.ink, "64px 40px", [barHoursLocation()], "800px", "0");

  const menuTeaser = bleed(
    BAR.ink,
    "96px 40px",
    [
      heading("On the menu", { size: "34px", color: BAR.cream, align: "center", font: BAR.font }),
      body("Replace with a one-line description of the drinks program. See the full menu for the list.", { size: "16px", color: BAR.creamFaint, align: "center" }),
      cta("See full menu", { background: BAR.accent, color: BAR.ink }),
    ],
    "640px",
    "16px",
  );

  const press = bleed(BAR.inkPanel, "40px 40px", [body("AS SEEN IN", { size: "12px", weight: "700", color: BAR.creamFaint, align: "center", font: BAR.labelFont }), barPressMarquee()], "1100px", "20px");

  const finalCta = bleed(
    BAR.accent,
    "72px 40px",
    [
      heading("Replace with a closing call to action", { size: "32px", color: BAR.ink, align: "center", font: BAR.font }),
      body("Replace with a supporting sentence about reservations or walk-ins.", { size: "16px", color: BAR.accentDeep, align: "center" }),
      cta("Reserve a table", { background: BAR.ink, color: BAR.cream }),
    ],
    "620px",
    "16px",
    { animation: "scale-in" },
  );

  return {
    version: 1,
    // An event spotlight and hours/location replaced a founding-year/
    // drink-count/nights-open stat-counter row (docs/site-templates-plan.md
    // feedback: that read as generic SaaS credibility furniture, not what
    // a nightlife visitor is actually scanning a bar's homepage for).
    root: mk("section", { layout: "stack" }, { padding: "0", background: BAR.ink, gap: "0" }, [
      barNav("HOME"),
      hero,
      pillars,
      ambience,
      eventSpotlight,
      menuTeaser,
      press,
      hoursLocation,
      finalCta,
      barFooter(),
    ]),
  };
}

export function barMenuTemplate(): PageContent {
  const heroBlock = barPageHero("Menu", "Replace with a menu-page headline", "Replace with a sentence about the drinks program — spirits sourcing, seasonal rotation, whatever's true.");

  const cocktails: DrinkSeed[] = [
    { name: "Replace with cocktail name 1", desc: "Replace with a short ingredient/flavor description.", price: "$14" },
    { name: "Replace with cocktail name 2", desc: "Replace with a short ingredient/flavor description.", price: "$15" },
    { name: "Replace with cocktail name 3", desc: "Replace with a short ingredient/flavor description.", price: "$14" },
    { name: "Replace with cocktail name 4", desc: "Replace with a short ingredient/flavor description.", price: "$16" },
    { name: "Replace with cocktail name 5", desc: "Replace with a short ingredient/flavor description.", price: "$13" },
    { name: "Replace with cocktail name 6", desc: "Replace with a short ingredient/flavor description.", price: "$15" },
  ];
  const cocktailSection = bleed(
    BAR.ink,
    "88px 40px",
    [heading("Cocktails", { size: "30px", color: BAR.cream, align: "center", font: BAR.font }), barDrinkGrid(cocktails)],
    "1100px",
    "32px",
  );

  const beerWine: DrinkSeed[] = [
    { name: "Replace with wine/beer name 1", desc: "Replace with a short description.", price: "$12" },
    { name: "Replace with wine/beer name 2", desc: "Replace with a short description.", price: "$11" },
    { name: "Replace with wine/beer name 3", desc: "Replace with a short description.", price: "$9" },
  ];
  const beerWineSection = bleed(
    BAR.inkPanel,
    "88px 40px",
    [heading("Wine & beer", { size: "30px", color: BAR.cream, align: "center", font: BAR.font }), barDrinkGrid(beerWine)],
    "1100px",
    "32px",
  );

  const note = bleed(
    BAR.ink,
    "56px 40px 88px",
    [body("Replace with a note about allergens, substitutions, or a snack/food-pairing menu if applicable.", { size: "14px", color: BAR.creamFaint, align: "center" })],
    "700px",
    "0",
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: BAR.ink, gap: "0" }, [barNav("MENU"), heroBlock, cocktailSection, beerWineSection, note, barFooter()]),
  };
}

type EventSeed = { date: string; title: string; blurb: string };

function barEventCard(e: EventSeed): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: BAR.inkPanel, padding: "0", borderRadius: "4px", gap: "0", align: "flex-start", borderColor: BAR.panelBorder, animation: "slide-up" },
    [
      mk("imageOverlay", { src: "https://placehold.co/700x500", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0.1", aspectRatio: "4 / 3", borderRadius: "4px 4px 0 0" }),
      mk("section", { layout: "stack" }, { background: "transparent", padding: "24px", gap: "8px" }, [
        body(e.date, { size: "12px", weight: "700", color: BAR.accent, font: BAR.labelFont }),
        heading(e.title, { size: "19px", color: BAR.cream, font: BAR.font, level: "h3" }),
        body(e.blurb, { size: "14px", color: BAR.creamFaint }),
      ]),
    ],
  );
}

export function barEventsTemplate(): PageContent {
  const heroBlock = barPageHero("Events", "Replace with an events-page headline", "Replace with a sentence about the kind of nights this room hosts — live sets, tastings, residencies.");

  const upcomingMarquee = bleed(
    BAR.inkPanel,
    "32px 40px",
    [body("UPCOMING", { size: "12px", weight: "700", color: BAR.creamFaint, align: "center", font: BAR.labelFont }), barPressMarquee()],
    "1100px",
    "16px",
  );

  const events: EventSeed[] = [
    { date: "Replace with a date 1", title: "Replace with event name 1", blurb: "Replace with a one-line description." },
    { date: "Replace with a date 2", title: "Replace with event name 2", blurb: "Replace with a one-line description." },
    { date: "Replace with a date 3", title: "Replace with event name 3", blurb: "Replace with a one-line description." },
  ];
  const eventGrid = bleed(BAR.ink, "88px 40px", [mk("columns", { columns: "3" }, { gap: "24px" }, events.map(barEventCard))], "1100px", "0");

  const finalCta = bleed(BAR.accent, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: BAR.ink, align: "center", font: BAR.font }), cta("RSVP", { background: BAR.ink, color: BAR.cream })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: BAR.ink, gap: "0" }, [barNav("EVENTS"), heroBlock, upcomingMarquee, eventGrid, finalCta, barFooter()]),
  };
}

export function barContactTemplate(): PageContent {
  const heroBlock = barPageHero("Contact", "Replace with a contact-page headline", "Replace with a sentence about reservations, private events, or general questions.");

  const formSection = bleed(
    BAR.ink,
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
                { id: randomUUID(), type: "text", label: "Party size", required: false },
                { id: randomUUID(), type: "textarea", label: "Message", required: true },
              ],
              submitLabel: "Send message",
              onSubmit: { action: "storeOnly" },
            },
            { padding: "0" },
          ),
          mk("section", { layout: "stack" }, { background: BAR.inkPanel, padding: "32px", borderRadius: "4px", gap: "16px", borderColor: BAR.panelBorder }, [
            heading("Replace with contact details", { size: "20px", color: BAR.cream, font: BAR.font }),
            body("Replace with an address.", { size: "15px", color: BAR.creamFaint }),
            body("Replace with a phone number.", { size: "15px", color: BAR.creamFaint }),
            body("Replace with opening hours.", { size: "15px", color: BAR.creamFaint }),
          ]),
        ],
      ),
    ],
    "1000px",
    "0",
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: BAR.ink, gap: "0" }, [barNav("CONTACT"), heroBlock, formSection, barFooter()]),
  };
}
