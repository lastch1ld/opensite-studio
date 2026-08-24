import type { Block, PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";
import { mk, heading, body, cta, bleed } from "./_shared";

// Hotel genre — docs/site-templates-plan.md Phase E. Structural reference
// is the plan doc's own description of tourism-wix-generator's
// "nordic-stone" template (split hero, page-hero subpages, "explore
// tiles" grid, stats row, restrained stone/ice palette) — the sibling
// repo itself isn't available in this worktree, so this is built from
// that description rather than the original source files.
//
// Palette: cool stone/ice, deliberately restrained — muted slate-greens
// and soft blue-grays with a single warm clay accent used sparingly (a
// stone lodge, not a saturated resort brochure). Fraunces (editorial
// serif) carries headings for a quiet, considered voice, distinct from
// SaaS's geometric Space Grotesk sans.
//
// Same per-page nav/footer band pattern as saas.ts — see that file's
// comment for why (a page template only ever produces one Page's
// draftContent, so the nav/footer are baked into every page rather than
// relying on a separate Theme Builder header/footer Template). All copy
// is generic/placeholder — never a fabricated room rate, review, or
// amenity claim.
const HOTEL = {
  ink: "#1C211E",
  inkMuted: "#9CA6A0",
  stone: "#F3F1EB",
  stoneDeep: "#E8E4DA",
  paper: "#FBFAF7",
  text: "#20241F",
  textFaint: "#666F68",
  ice: "#7E97A3",
  iceSoft: "#E4EBEC",
  clay: "#AD8462",
  border: "#DEDACF",
  font: "fraunces",
} as const;

function hotelNav(active: string): Block {
  const links = ["Home", "Rooms", "Amenities", "Contact"];
  return mk(
    "section",
    { layout: "row" },
    { background: HOTEL.paper, padding: "20px 40px", justify: "space-between", align: "center", borderRadius: "0" },
    [
      body("Hotel name", { size: "16px", weight: "700", color: HOTEL.text, font: HOTEL.font }),
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", gap: "28px", align: "center" },
        links.map((l) => body(l, { size: "14px", weight: l === active ? "700" : "400", color: l === active ? HOTEL.ice : HOTEL.textFaint })),
      ),
    ],
  );
}

function hotelFooter(): Block {
  return bleed(
    HOTEL.ink,
    "56px 40px",
    [
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", justify: "space-between", align: "center" },
        [
          body("Hotel name", { size: "15px", weight: "700", color: "#F4F4F1", font: HOTEL.font }),
          body("Replace with a real copyright line and links.", { size: "13px", color: HOTEL.inkMuted }),
        ],
      ),
    ],
    "1100px",
    "0",
  );
}

function hotelPageHero(eyebrow: string, title: string, sub: string): Block {
  return bleed(
    HOTEL.ink,
    "80px 40px 72px",
    [
      body(eyebrow, { size: "13px", weight: "700", color: HOTEL.ice, align: "center" }),
      heading(title, { size: "44px", color: "#F4F4F1", align: "center", level: "h1", font: HOTEL.font }),
      body(sub, { size: "17px", color: HOTEL.inkMuted, align: "center" }),
    ],
    "680px",
    "16px",
  );
}

// Always dropped onto a dark HOTEL.ink band in this template (see the
// checklist in docs/site-templates-plan.md — statCounter's default
// valueColor is near-black and unreadable on a dark bleed() unless
// overridden explicitly).
function hotelStatRow(stats: { value: string; suffix: string; label: string }[]): Block {
  return mk(
    "columns",
    { columns: String(stats.length) },
    { gap: "24px", animation: "fade-in" },
    stats.map((s) =>
      mk("statCounter", { value: s.value, prefix: "", suffix: s.suffix, label: s.label }, { valueColor: "#F4F4F1", valueFontSize: "40px", labelColor: HOTEL.inkMuted, align: "center" }),
    ),
  );
}

function hotelFeatureCard(title: string, copy: string): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: HOTEL.paper, padding: "32px", borderRadius: "4px", gap: "12px", align: "flex-start", borderColor: HOTEL.border, animation: "slide-up" },
    [heading(title, { size: "19px", color: HOTEL.text, font: HOTEL.font }), body(copy, { size: "15px", color: HOTEL.textFaint })],
  );
}

export function hotelHomeTemplate(): PageContent {
  // Split hero: headline + image side by side, per the plan doc's
  // nordic-stone reference.
  const hero = bleed(
    HOTEL.stone,
    "100px 40px",
    [
      mk(
        "columns",
        { columns: "2" },
        { gap: "56px", align: "center" },
        [
          mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "18px", animation: "slide-right" }, [
            body("Replace with a location label", { size: "13px", weight: "700", color: HOTEL.clay }),
            heading("Replace with your hotel's core promise — quiet, place, comfort.", { size: "48px", color: HOTEL.text, level: "h1", font: HOTEL.font }),
            body("Replace with a sentence about the setting and the feeling of staying here.", { size: "17px", color: HOTEL.textFaint }),
            mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "12px" }, [
              cta("Check availability", { background: HOTEL.ink, color: "#ffffff" }),
              cta("View rooms", { background: "transparent", color: HOTEL.text, variant: "secondary" }),
            ]),
          ]),
          mk(
            "imageOverlay",
            { src: "https://placehold.co/900x1100", alt: "Hotel exterior", caption: "" },
            { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "3 / 4", borderRadius: "4px", animation: "slide-left" },
          ),
        ],
      ),
    ],
    "1160px",
    "0",
  );

  const welcome = bleed(
    HOTEL.paper,
    "88px 40px",
    [
      heading("Replace with a welcoming line about arrival", { size: "30px", color: HOTEL.text, align: "center", font: HOTEL.font }),
      body("Replace with two or three sentences about what makes a stay here different — the setting, the pace, the craft in the details.", { size: "17px", color: HOTEL.textFaint, align: "center" }),
    ],
    "700px",
    "16px",
  );

  // "Explore tiles" grid — plan doc's nordic-stone reference. `list`
  // needs a bound Collection (no static-content fit for a page
  // template's baked-in draftContent); `gallery` renders image + caption
  // tiles directly, which is the closer match for a static tile grid.
  const explore = bleed(
    HOTEL.stoneDeep,
    "96px 40px",
    [
      heading("Explore the hotel", { size: "32px", color: HOTEL.text, align: "center", font: HOTEL.font }),
      body("Replace with a sentence inviting guests to look around.", { size: "16px", color: HOTEL.textFaint, align: "center" }),
      mk(
        "gallery",
        {
          images: [
            { id: randomUUID(), src: "https://placehold.co/700x900", alt: "Rooms and suites", caption: "Rooms & Suites" },
            { id: randomUUID(), src: "https://placehold.co/700x900", alt: "Dining room", caption: "Dining" },
            { id: randomUUID(), src: "https://placehold.co/700x900", alt: "Spa and wellness", caption: "Spa & Wellness" },
            { id: randomUUID(), src: "https://placehold.co/700x900", alt: "Grounds and gardens", caption: "Grounds & Gardens" },
          ],
          columns: "4",
        },
        { gap: "16px", animation: "fade-in" },
      ),
    ],
    "1160px",
    "28px",
  );

  const stats = bleed(HOTEL.ink, "72px 40px", [hotelStatRow([
    { value: "1912", suffix: "", label: "Replace with a real founding year" },
    { value: "42", suffix: "", label: "Replace with a real room count" },
    { value: "9", suffix: ".2", label: "Replace with a real guest rating" },
  ])], "1000px", "0");

  const finalCta = bleed(
    HOTEL.clay,
    "72px 40px",
    [
      heading("Replace with a closing invitation to book", { size: "32px", color: "#ffffff", align: "center", font: HOTEL.font }),
      body("Replace with a supporting sentence.", { size: "16px", color: "#FBEFE5", align: "center" }),
      cta("Check availability", { background: "#ffffff", color: HOTEL.clay }),
    ],
    "620px",
    "16px",
    { animation: "scale-in" },
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: HOTEL.paper, gap: "0" }, [
      hotelNav("Home"),
      hero,
      welcome,
      explore,
      stats,
      finalCta,
      hotelFooter(),
    ]),
  };
}

type RoomSeed = { name: string; description: string };

export function hotelRoomsTemplate(): PageContent {
  const heroBlock = hotelPageHero("Rooms", "Replace with a rooms-page headline", "Replace with a sentence framing the room categories below.");

  const rooms: RoomSeed[] = [
    { name: "Standard Room", description: "Replace with a description of the entry room category — size, view, bed configuration." },
    { name: "Deluxe Room", description: "Replace with a description of the mid-tier room category." },
    { name: "Suite", description: "Replace with a description of the top-tier room category." },
  ];
  const roomSwitcher = bleed(
    HOTEL.paper,
    "88px 40px",
    [
      heading("Room categories", { size: "32px", color: HOTEL.text, align: "center", font: HOTEL.font }),
      mk(
        "contentSwitcher",
        { items: rooms.map((r) => ({ id: randomUUID(), label: r.name, image: "https://placehold.co/900x650", description: r.description })) },
        { activeColor: HOTEL.text, inactiveColor: HOTEL.inkMuted, imageAspectRatio: "3 / 2", animation: "fade-in" },
      ),
    ],
    "1000px",
    "32px",
  );

  const included = bleed(
    HOTEL.stoneDeep,
    "88px 40px",
    [
      heading("Included with every room", { size: "30px", color: HOTEL.text, align: "center", font: HOTEL.font }),
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        hotelFeatureCard("Replace with amenity one", "Replace with a short description."),
        hotelFeatureCard("Replace with amenity two", "Replace with a short description."),
        hotelFeatureCard("Replace with amenity three", "Replace with a short description."),
      ]),
    ],
    "1100px",
    "24px",
  );

  const finalCta = bleed(HOTEL.ink, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: "#F4F4F1", align: "center", font: HOTEL.font }), cta("Check availability", { background: "#ffffff", color: HOTEL.text })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: HOTEL.paper, gap: "0" }, [hotelNav("Rooms"), heroBlock, roomSwitcher, included, finalCta, hotelFooter()]),
  };
}

export function hotelAmenitiesTemplate(): PageContent {
  const heroBlock = hotelPageHero("Amenities", "Replace with an amenities-page headline", "Replace with a sentence framing the gallery below.");

  // Gallery block as the page's centerpiece, per the task brief.
  const galleryBlock = bleed(
    HOTEL.paper,
    "88px 40px",
    [
      mk(
        "gallery",
        {
          images: [
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Spa", caption: "Spa & Wellness" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Pool", caption: "Pool" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Restaurant", caption: "Restaurant" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Fitness room", caption: "Fitness Room" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Garden", caption: "Garden" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Lounge", caption: "Lounge" },
          ],
          columns: "3",
        },
        { gap: "16px", animation: "fade-in" },
      ),
    ],
    "1160px",
    "0",
  );

  const amenityList = bleed(
    HOTEL.stoneDeep,
    "88px 40px",
    [
      heading("On-site amenities", { size: "30px", color: HOTEL.text, align: "center", font: HOTEL.font }),
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        hotelFeatureCard("Replace with amenity one", "Replace with a short description."),
        hotelFeatureCard("Replace with amenity two", "Replace with a short description."),
        hotelFeatureCard("Replace with amenity three", "Replace with a short description."),
      ]),
    ],
    "1100px",
    "24px",
  );

  const finalCta = bleed(HOTEL.clay, "72px 40px", [heading("Replace with a closing invitation to book", { size: "30px", color: "#ffffff", align: "center", font: HOTEL.font }), cta("Check availability", { background: "#ffffff", color: HOTEL.clay })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: HOTEL.paper, gap: "0" }, [hotelNav("Amenities"), heroBlock, galleryBlock, amenityList, finalCta, hotelFooter()]),
  };
}

export function hotelContactTemplate(): PageContent {
  const heroBlock = hotelPageHero("Contact & Book", "Replace with a contact/booking headline", "Replace with a sentence about response time or what to expect when booking.");

  const formSection = bleed(
    HOTEL.paper,
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
                { id: randomUUID(), type: "text", label: "Check-in date", required: true },
                { id: randomUUID(), type: "text", label: "Check-out date", required: true },
                { id: randomUUID(), type: "textarea", label: "Special requests", required: false },
              ],
              submitLabel: "Request booking",
              onSubmit: { action: "storeOnly" },
            },
            { padding: "0" },
          ),
          mk("section", { layout: "stack" }, { background: HOTEL.stoneDeep, padding: "32px", borderRadius: "4px", gap: "16px" }, [
            heading("Replace with contact details", { size: "20px", color: HOTEL.text, font: HOTEL.font }),
            body("Replace with an email address.", { size: "15px", color: HOTEL.textFaint }),
            body("Replace with a phone number (optional).", { size: "15px", color: HOTEL.textFaint }),
            body("Replace with a physical address.", { size: "15px", color: HOTEL.textFaint }),
          ]),
        ],
      ),
    ],
    "1000px",
    "0",
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: HOTEL.paper, gap: "0" }, [hotelNav("Contact"), heroBlock, formSection, hotelFooter()]),
  };
}
