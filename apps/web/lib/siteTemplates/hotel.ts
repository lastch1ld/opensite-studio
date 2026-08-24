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

// `eyebrow` param kept for call-site compatibility but no longer rendered
// as a kicker label — impeccable craft-floor bans it outright.
function hotelPageHero(_eyebrow: string, title: string, sub: string): Block {
  return bleed(
    HOTEL.ink,
    "80px 40px 72px",
    [
      heading(title, { size: "44px", color: "#F4F4F1", align: "center", level: "h1", font: HOTEL.font }),
      body(sub, { size: "17px", color: HOTEL.inkMuted, align: "center" }),
    ],
    "680px",
    "16px",
  );
}

type RoomRateSeed = { name: string; rate: string; description: string };

// Room type + nightly rate is the actual decision a hotel homepage visitor
// is making — the original home page had no room/rate content at all,
// jumping straight from a photo grid to a bare stat-counter row.
function hotelRoomRateCard(r: RoomRateSeed): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: "#ffffff", padding: "0", borderRadius: "4px", gap: "0", align: "flex-start", borderColor: HOTEL.border, animation: "slide-up" },
    [
      mk("imageOverlay", { src: "https://placehold.co/600x450", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 3", borderRadius: "4px 4px 0 0" }),
      mk("section", { layout: "stack" }, { background: "transparent", padding: "20px", gap: "6px", align: "flex-start" }, [
        mk("section", { layout: "row" }, { background: "transparent", padding: "0", justify: "space-between", align: "center" }, [
          heading(r.name, { size: "18px", color: HOTEL.text, font: HOTEL.font }),
          body(r.rate, { size: "15px", weight: "700", color: HOTEL.clay }),
        ]),
        body(r.description, { size: "14px", color: HOTEL.textFaint }),
      ]),
    ],
  );
}

// A named guest review + rating is the trust signal a hotel booking
// decision actually turns on — a bare stat-counter number (this genre's
// original home page had "9.2" with no context beyond a "guest rating"
// caption) reads as a dashboard widget, not hospitality proof.
function hotelReview(quote: string, name: string, rating: string): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: "transparent", padding: "0", gap: "14px", align: "center" },
    [
      body(rating, { size: "15px", weight: "700", color: HOTEL.clay, align: "center" }),
      heading(`“${quote}”`, { size: "26px", color: "#F4F4F1", align: "center", font: HOTEL.font, weight: "500" }),
      body(name, { size: "14px", color: HOTEL.inkMuted, align: "center" }),
    ],
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
  // nordic-stone reference. Plain solid stone — `bleed()`/`section`'s
  // `background` style key maps to CSS `background-color`, which cannot
  // hold a gradient or url() (a prior pass's line-art-arch data-URI here
  // never actually rendered, caught on re-inspection). No CSS trick
  // needed regardless: this hero already carries a real photo via the
  // `imageOverlay` exterior shot in the split layout below.
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
    {},
    { backgroundTexture: "grain" },
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

  const roomTeaser = bleed(
    HOTEL.paper,
    "88px 40px",
    [
      heading("Rooms & rates", { size: "32px", color: HOTEL.text, align: "center", font: HOTEL.font }),
      body("Replace with a sentence framing the categories below — see the full Rooms page for details.", { size: "16px", color: HOTEL.textFaint, align: "center" }),
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        hotelRoomRateCard({ name: "Standard Room", rate: "Replace with a rate, e.g. from $180/night", description: "Replace with a description — size, view, bed configuration." }),
        hotelRoomRateCard({ name: "Deluxe Room", rate: "Replace with a rate", description: "Replace with a description." }),
        hotelRoomRateCard({ name: "Suite", rate: "Replace with a rate", description: "Replace with a description." }),
      ]),
      cta("View all rooms", { background: HOTEL.ink, color: "#ffffff" }),
    ],
    "1100px",
    "24px",
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

  const review = bleed(HOTEL.ink, "80px 40px", [hotelReview("Replace with a real guest review — one honest sentence about the stay.", "Replace with a name, or “Verified guest”", "★★★★★ Replace with a real average rating")], "700px", "0");

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
    // Room/rate cards and a named guest review replaced a founding-year/
    // room-count/rating stat-counter row (docs/site-templates-plan.md
    // feedback: that read as a SaaS credibility widget reskinned onto a
    // hotel, not the room-price and trust content a booking visitor
    // actually needs — see hotelRoomRateCard/hotelReview above).
    root: mk("section", { layout: "stack" }, { padding: "0", background: HOTEL.paper, gap: "0" }, [
      hotelNav("Home"),
      hero,
      welcome,
      roomTeaser,
      explore,
      review,
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
