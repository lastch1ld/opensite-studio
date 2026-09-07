import type { Block, PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";
import { mk, heading, body, cta, bleed, badge, heroPhotoPlaceholder } from "./_shared";

// Bar / nightlife genre — docs/site-templates-plan.md Phase F.
// Clean-sheet rebuild (not a recolor): direct feedback that the previous
// amber/copper pass "still looked broken" (plain gray placehold.co tiles
// clashing against a dark theme everywhere but the hero) and asked for a
// genuinely different structure, not a re-hued version of the same
// full-bleed-hero → marquee → 3-card-grid rhythm every other genre
// already uses. This version:
// - A fixed left side-rail nav (position: fixed, new `sticky: "fixed-left"`
//   value on the shared sticky mechanism) instead of a top bar — every
//   page's root section pads its content left by the rail's own width.
// - A split-screen hero (copy left, a tinted gradient panel right) instead
//   of a full-bleed photo — sidesteps the placehold.co-bakes-visible-text
//   problem entirely for the hero, and reads structurally distinct from
//   every genre using `hero`'s backgroundImage.
// - A numeral-led editorial block for tonight's event instead of a card.
// - A real printed-menu price-list layout (name / price, dotted-free
//   simplification of the mockup's leader) instead of a card grid.
// Palette: near-black plum + a vivid magenta accent — distinct from every
// other genre's hue (SaaS indigo, Agency crimson, Portfolio/Restaurant
// forest-green, Hotel slate-blue). Fraunces for display, IBM Plex Mono for
// labels/nav — unchanged from the prior pass, kept because the type
// pairing itself was never the complaint.
const BAR = {
  ink: "#150E16",
  inkPanel: "#1E1522",
  panelBorder: "#332638",
  cream: "#F2ECEF",
  creamFaint: "#9C8FA3",
  accent: "#D9469E",
  accentDeep: "#4A1E3B",
  font: "instrument-serif",
  labelFont: "plex-mono",
  railWidth: "84px",
} as const;

function railNav(active: string): Block {
  const links = ["MENU", "EVENTS", "CONTACT"];
  return mk(
    "section",
    { layout: "stack" },
    // `minHeight: "100vh"` — the `fixed-left` wrapper itself stretches to
    // the full viewport (top:0 + bottom:0), but this section is a plain
    // block inside it with no height of its own, so it was shrinking to
    // fit just its content (~150px) instead of filling that space —
    // `justify: "space-between"` had nothing to spread across, so
    // HIDEOUT/links/dot all crammed together at the very top.
    { background: BAR.ink, width: BAR.railWidth, minHeight: "100vh", padding: "28px 0", align: "center", justify: "space-between", gap: "0", sticky: "fixed-left" },
    [
      body("HIDEOUT", { size: "11px", weight: "600", color: BAR.cream, align: "center", font: BAR.labelFont }),
      mk(
        "section",
        { layout: "stack" },
        { background: "transparent", padding: "0", gap: "24px", align: "center" },
        links.map((l) => body(l, { size: "10px", weight: l === active ? "700" : "400", color: l === active ? BAR.accent : BAR.creamFaint, align: "center", font: BAR.labelFont })),
      ),
      mk("text", { content: "●" }, { fontSize: "8px", color: BAR.accent, textAlign: "center" }),
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
      heading(title, { size: "44px", color: BAR.cream, align: "left", level: "h1", font: BAR.font }),
      body(sub, { size: "17px", color: BAR.creamFaint, align: "left" }),
    ],
    "680px",
    "16px",
    { align: "flex-start" },
  );
}

type DrinkSeed = { name: string; desc: string; price: string };

// Printed-menu row (name / price, no card chrome) — the actual "clean
// sheet" replacement for the previous pass's uniform drink-card grid.
function drinkRow(d: DrinkSeed): Block {
  return mk("section", { layout: "stack" }, { background: "transparent", padding: "14px 0", gap: "4px", borderColor: BAR.panelBorder }, [
    mk("section", { layout: "row" }, { background: "transparent", padding: "0", justify: "space-between", align: "baseline", gap: "12px" }, [
      heading(d.name, { size: "19px", color: BAR.cream, font: BAR.font, level: "h3" }),
      body(d.price, { size: "14px", color: BAR.creamFaint, font: BAR.labelFont }),
    ]),
    body(d.desc, { size: "13px", color: BAR.creamFaint }),
  ]);
}

function menuColumn(category: string, drinks: DrinkSeed[]): Block {
  return mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "2px" }, [
    body(category, { size: "12px", weight: "700", color: BAR.accent, font: BAR.labelFont }),
    ...drinks.map(drinkRow),
  ]);
}

export function barHomeTemplate(): PageContent {
  // Split-screen hero: copy left, a tinted gradient panel right — not a
  // full-bleed photo. Sidesteps placehold.co's baked-in-text problem for
  // the hero entirely (no photo placeholder needed at all) and reads as a
  // structurally different composition from every `hero`-block-
  // backgroundImage genre.
  // `columns` (not a plain `section{layout:"row"}`) for both rows below —
  // a fixed-width side rail leaves noticeably less horizontal room for
  // the hero copy than a normal full-width mobile layout gets elsewhere,
  // and a plain row never wraps on narrow viewports: two real buttons
  // (padding + label width) overflowed the rail-narrowed column and got
  // clipped at the viewport edge on mobile. `columns` already collapses
  // to a single stacked column at the mobile breakpoint (the same
  // mechanism every image grid in this codebase relies on), so reusing
  // it here gets that for free instead of needing a new "wrap" style key.
  const heroCopy = mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "24px", align: "flex-start", justify: "center" }, [
    mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "10px" }, [
      badge("★ 4.8 · 300+ reviews", { tone: "warning" }),
      badge("Open since 2016", { tone: "neutral" }),
    ]),
    heading("The room, the drinks, the night.", { size: "58px", color: BAR.cream, level: "h1", font: BAR.font, animation: "slide-up" }),
    body("Replace with a supporting sentence about the atmosphere and who this room is for.", { size: "17px", color: BAR.creamFaint }),
    mk("columns", { columns: "2" }, { gap: "12px", animation: "fade-in" }, [
      cta("Reserve a table", { background: BAR.accent, color: "#ffffff" }),
      cta("View the menu", { background: "transparent", color: BAR.cream, variant: "secondary" }),
    ]),
  ]);
  // No `aspectRatio` — a fixed ratio caps this panel's height to its own
  // width regardless of the grid row's actual (stretched) height, which
  // left it stopping well short of the hero's 92vh with dead empty space
  // below. Leaving it unset lets the grid's `align-items: stretch`
  // default (now reachable via `columns`'s own `minHeight` below) give
  // this column a real height, which the absolutely-positioned `<img>`
  // (`inset: 0`) then fills exactly.
  const heroVisual = mk(
    "imageOverlay",
    { src: heroPhotoPlaceholder(BAR.accent), alt: "Replace with a description of this image", caption: "— the bar, tonight" },
    { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "", borderRadius: "0", animation: "scale-in" },
  );
  const hero = mk(
    "section",
    { layout: "stack" },
    { background: BAR.ink, padding: "0", minHeight: "92vh", gap: "0" },
    [mk("columns", { columns: "2" }, { gap: "0", minHeight: "92vh" }, [
      mk("section", { layout: "stack" }, { background: "transparent", padding: "56px", justify: "center" }, [heroCopy]),
      heroVisual,
    ])],
  );

  // Numeral-led editorial block for tonight's event, replacing the
  // previous image-card spotlight — a bare oversized "01" is real
  // typographic weight, not another photo placeholder.
  const tonight = bleed(
    BAR.ink,
    "88px 40px",
    [
      mk("columns", { columns: "2" }, { gap: "40px", align: "flex-start" }, [
        heading("01", { size: "128px", color: BAR.accent, weight: "400", font: BAR.font }),
        mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "12px", align: "flex-start" }, [
          body("THIS FRIDAY", { size: "12px", weight: "700", color: BAR.creamFaint, font: BAR.labelFont }),
          heading("Replace with tonight's event name", { size: "30px", color: BAR.cream, font: BAR.font }),
          body("Replace with a one-line description of what's happening.", { size: "15px", color: BAR.creamFaint }),
          cta("See all events", { background: BAR.accent, color: "#ffffff" }),
        ]),
      ]),
    ],
    "1000px",
    "0",
  );

  const menuTeaser = bleed(
    BAR.inkPanel,
    "88px 40px",
    [
      heading("On the menu", { size: "32px", color: BAR.cream, font: BAR.font }),
      body("Replace with a one-line description of the drinks program.", { size: "15px", color: BAR.creamFaint }),
      mk("columns", { columns: "2" }, { gap: "56px" }, [
        menuColumn("SIGNATURES", [
          { name: "Replace with drink one", desc: "Replace with a short ingredient/flavor description.", price: "$14" },
          { name: "Replace with drink two", desc: "Replace with a short ingredient/flavor description.", price: "$15" },
        ]),
        menuColumn("CLASSICS", [
          { name: "Replace with drink three", desc: "Replace with a short ingredient/flavor description.", price: "$13" },
          { name: "Replace with drink four", desc: "Replace with a short ingredient/flavor description.", price: "$16" },
        ]),
      ]),
      cta("See full menu", { background: BAR.accent, color: "#ffffff" }),
    ],
    "900px",
    "24px",
  );

  const hoursLocation = bleed(
    BAR.ink,
    "64px 40px",
    [
      mk("columns", { columns: "2" }, { gap: "48px", align: "flex-start" }, [
        mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "10px", align: "flex-start" }, [
          heading("Hours", { size: "18px", color: BAR.cream, font: BAR.font }),
          body("Replace with days and hours, e.g. Wed–Sat, 6pm–2am.", { size: "15px", color: BAR.creamFaint }),
        ]),
        mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "10px", align: "flex-start" }, [
          heading("Find us", { size: "18px", color: BAR.cream, font: BAR.font }),
          body("Replace with a street address.", { size: "15px", color: BAR.creamFaint }),
        ]),
      ]),
    ],
    "800px",
    "0",
  );

  const finalCta = bleed(
    BAR.accent,
    "72px 40px",
    [
      heading("Replace with a closing call to action", { size: "32px", color: "#ffffff", align: "center", font: BAR.font }),
      body("Replace with a supporting sentence about reservations or walk-ins.", { size: "16px", color: "#ffffff", align: "center" }),
      cta("Reserve a table", { background: "#ffffff", color: BAR.accent }),
    ],
    "620px",
    "16px",
    { animation: "scale-in" },
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0 0 0 " + BAR.railWidth, background: BAR.ink, gap: "0" }, [
      railNav("MENU"),
      hero,
      tonight,
      menuTeaser,
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
  ];
  const beerWine: DrinkSeed[] = [
    { name: "Replace with wine/beer name 1", desc: "Replace with a short description.", price: "$12" },
    { name: "Replace with wine/beer name 2", desc: "Replace with a short description.", price: "$11" },
    { name: "Replace with wine/beer name 3", desc: "Replace with a short description.", price: "$9" },
  ];

  const menuSheet = bleed(
    BAR.ink,
    "80px 40px 96px",
    [mk("columns", { columns: "2" }, { gap: "56px" }, [menuColumn("SIGNATURES", cocktails), menuColumn("WINE & BEER", beerWine)])],
    "900px",
    "0",
  );

  const note = bleed(
    BAR.inkPanel,
    "56px 40px",
    [body("Replace with a note about allergens, substitutions, or a snack/food-pairing menu if applicable.", { size: "14px", color: BAR.creamFaint, align: "center" })],
    "700px",
    "0",
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0 0 0 " + BAR.railWidth, background: BAR.ink, gap: "0" }, [railNav("MENU"), heroBlock, menuSheet, note, barFooter()]),
  };
}

type EventSeed = { date: string; title: string; blurb: string };

function barEventRow(e: EventSeed, i: number): Block {
  return mk("columns", { columns: "2" }, { gap: "32px", align: "center" }, [
    heading(String(i + 1).padStart(2, "0"), { size: "72px", color: BAR.accent, weight: "400", font: BAR.font }),
    mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "8px", align: "flex-start" }, [
      body(e.date, { size: "12px", weight: "700", color: BAR.creamFaint, font: BAR.labelFont }),
      heading(e.title, { size: "22px", color: BAR.cream, font: BAR.font }),
      body(e.blurb, { size: "14px", color: BAR.creamFaint }),
    ]),
  ]);
}

export function barEventsTemplate(): PageContent {
  const heroBlock = barPageHero("Events", "Replace with an events-page headline", "Replace with a sentence about the kind of nights this room hosts — live sets, tastings, residencies.");

  const events: EventSeed[] = [
    { date: "Replace with a date 1", title: "Replace with event name 1", blurb: "Replace with a one-line description." },
    { date: "Replace with a date 2", title: "Replace with event name 2", blurb: "Replace with a one-line description." },
    { date: "Replace with a date 3", title: "Replace with event name 3", blurb: "Replace with a one-line description." },
  ];
  const eventList = bleed(
    BAR.ink,
    "88px 40px",
    [mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "48px" }, events.map(barEventRow))],
    "900px",
    "0",
  );

  const finalCta = bleed(BAR.accent, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: "#ffffff", align: "center", font: BAR.font }), cta("RSVP", { background: "#ffffff", color: BAR.accent })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0 0 0 " + BAR.railWidth, background: BAR.ink, gap: "0" }, [railNav("EVENTS"), heroBlock, eventList, finalCta, barFooter()]),
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
          mk("section", { layout: "stack" }, { background: BAR.inkPanel, padding: "32px", borderRadius: "4px", gap: "16px" }, [
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
    root: mk("section", { layout: "stack" }, { padding: "0 0 0 " + BAR.railWidth, background: BAR.ink, gap: "0" }, [railNav("CONTACT"), heroBlock, formSection, barFooter()]),
  };
}
