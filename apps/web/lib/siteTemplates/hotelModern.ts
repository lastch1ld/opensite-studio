import type { Block, PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";
import { mk, heading, body, cta, bleed, badge, heroPhotoPlaceholder } from "./_shared";

// Hotel — Modern genre. Clean-sheet replacement for the old single
// "Hotel" template (docs/site-templates-plan.md Phase E), one of three
// new hotel registers researched directly off live Framer hotel
// templates rather than reused/recolored from this codebase's existing
// genres — reference: Mariven ("Elegant Coastal Hotel" — full-bleed
// architectural pool/villa photography under a dark scrim, a big
// confident serif-adjacent headline low in the hero, location + phone
// in the nav, a floating review-rating note).
// Palette: near-black navy ink + warm off-white paper + one muted
// steel/slate-blue accent — a cool, architectural register, distinct
// from every other genre's warm accent (SaaS indigo, Agency crimson,
// Portfolio/Restaurant forest-green, Bar magenta) and from this file's
// sibling hotel registers (Boutique's olive+terracotta, Resort's gold).
// Plus Jakarta Sans (rounded geometric) carries headings — the one
// FONT_STACKS entry no other genre template uses yet, so "Modern" reads
// as typographically distinct at a glance, not just recolored.
const MODERN = {
  ink: "#0B1220",
  inkDeep: "#060A12",
  paper: "#F6F5F1",
  paperDim: "#EAE7DF",
  text: "#12151C",
  textFaint: "#5C6270",
  accent: "#5B7A8C",
  accentDeep: "#33475A",
  border: "#DEDCD3",
  font: "jakarta-sans",
} as const;

function modernNav(active: string): Block {
  const links = ["Home", "Rooms", "Amenities", "Contact"];
  return mk(
    "section",
    { layout: "row" },
    { background: MODERN.paper, padding: "22px 40px", justify: "space-between", align: "center" },
    [
      body("HOTEL NAME", { size: "13px", weight: "700", color: MODERN.text, font: MODERN.font }),
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", gap: "28px", align: "center" },
        links.map((l) =>
          mk(
            "text",
            { content: l.toUpperCase() },
            { fontSize: "12px", fontWeight: l === active ? "700" : "500", color: l === active ? MODERN.accentDeep : MODERN.textFaint, letterSpacing: "0.06em", ...(MODERN.font ? { fontFamily: MODERN.font } : {}) },
          ),
        ),
      ),
    ],
  );
}

function modernFooter(): Block {
  return bleed(
    MODERN.ink,
    "56px 40px",
    [
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", justify: "space-between", align: "center" },
        [
          body("Hotel name", { size: "15px", weight: "700", color: "#F6F5F1", font: MODERN.font }),
          body("Replace with a real copyright line and links.", { size: "13px", color: "#8A93A3" }),
        ],
      ),
    ],
    "1100px",
    "0",
  );
}

function modernPageHero(title: string, sub: string): Block {
  return mk(
    "hero",
    { backgroundImage: heroPhotoPlaceholder(MODERN.accent) },
    {
      background: MODERN.ink,
      padding: "72px 40px",
      contentWidth: "700px",
      align: "center",
      gap: "16px",
      minHeight: "44vh",
    },
    [
      heading(title, { size: "44px", color: "#ffffff", align: "center", level: "h1", font: MODERN.font }),
      body(sub, { size: "17px", color: "#CBD2DA", align: "center" }),
    ],
  );
}

type RoomRateSeed = { name: string; rate: string; description: string };

function modernRoomCard(r: RoomRateSeed): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: "#ffffff", padding: "0", borderRadius: "12px", gap: "0", align: "center", borderColor: MODERN.border, animation: "slide-up" },
    [
      mk("imageOverlay", { src: "https://placehold.co/600x450", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 3", borderRadius: "12px 12px 0 0", imageTreatment: "warm" }),
      mk("section", { layout: "stack" }, { background: "transparent", padding: "20px", gap: "6px", align: "flex-start" }, [
        mk("section", { layout: "row" }, { background: "transparent", padding: "0", justify: "space-between", align: "center" }, [
          heading(r.name, { size: "18px", color: MODERN.text, font: MODERN.font }),
          body(r.rate, { size: "15px", weight: "700", color: MODERN.accentDeep }),
        ]),
        body(r.description, { size: "14px", color: MODERN.textFaint }),
      ]),
    ],
  );
}

function modernFeatureCard(title: string, copy: string, imgLabel: string): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: "#ffffff", padding: "0", borderRadius: "12px", gap: "0", align: "center", animation: "slide-up" },
    [
      mk("imageOverlay", { src: `https://placehold.co/700x500?text=${encodeURIComponent(imgLabel)}`, alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 3", borderRadius: "12px 12px 0 0", imageTreatment: "warm" }),
      mk("section", { layout: "stack" }, { background: "transparent", padding: "22px", gap: "8px", align: "flex-start" }, [
        heading(title, { size: "18px", color: MODERN.text, font: MODERN.font }),
        body(copy, { size: "14px", color: MODERN.textFaint }),
      ]),
    ],
  );
}

export function hotelModernHomeTemplate(): PageContent {
  const hero = mk(
    "hero",
    { backgroundImage: heroPhotoPlaceholder(MODERN.accent) },
    {
      background: MODERN.ink,
      padding: "48px 40px 80px",
      contentWidth: "780px",
      align: "flex-start",
      verticalAlign: "flex-end",
      gap: "18px",
      minHeight: "88vh",
    },
    [
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "10px" }, [
        badge("★ 4.9 rated", { tone: "warning" }),
        badge("Malibu, CA", { tone: "neutral" }),
      ]),
      heading("Your home by the coast.", { size: "64px", color: "#ffffff", level: "h1", font: MODERN.font, animation: "slide-up" }),
      body("Replace with a sentence about the setting — the coastline, the architecture, the feeling of arrival.", { size: "18px", color: "#D7DCE3" }),
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "12px", animation: "fade-in" }, [
        cta("Explore rooms", { background: "#ffffff", color: MODERN.ink }),
        cta("Check availability", { background: "transparent", color: "#ffffff", variant: "secondary" }),
      ]),
    ],
  );

  // A floating panel pulled up over the hero photo's bottom edge via a
  // real negative margin (not a visual nudge — the box itself moves, so
  // nothing below it leaves a gap) — the single biggest lever for
  // reading as a considered composition instead of another stacked
  // hero → band → band rhythm. `boxShadow: "elevated"` sells the
  // "floating above the photo" read; without it, the panel's straight
  // edge cutting across the photo reads as a layering glitch rather
  // than a deliberate device.
  const roomTeaser = bleed(
    "transparent",
    "0 40px",
    [
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", justify: "space-between", align: "flex-end" }, [
        heading("Rooms & rates", { size: "28px", color: MODERN.text, font: MODERN.font }),
        mk("text", { content: "VIEW ALL ROOMS" }, { fontSize: "12px", fontWeight: "700", color: MODERN.accentDeep, letterSpacing: "0.06em" }),
      ]),
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        modernRoomCard({ name: "Ocean Room", rate: "Replace with a rate, e.g. from $220/night", description: "Replace with a description — size, view, bed configuration." }),
        modernRoomCard({ name: "Terrace Suite", rate: "Replace with a rate", description: "Replace with a description." }),
        modernRoomCard({ name: "Penthouse", rate: "Replace with a rate", description: "Replace with a description." }),
      ]),
    ],
    "1160px",
    "28px",
    { background: "#ffffff", padding: "48px 40px", borderRadius: "20px", boxShadow: "elevated", marginTop: "-96px", animation: "slide-up" },
  );

  const welcome = bleed(
    MODERN.paper,
    "96px 40px 88px",
    [
      heading("Replace with a welcoming line about arrival", { size: "30px", color: MODERN.text, align: "center", font: MODERN.font }),
      body("Replace with two or three sentences about what makes a stay here different — the setting, the architecture, the quiet.", { size: "17px", color: MODERN.textFaint, align: "center" }),
    ],
    "700px",
    "16px",
  );

  const features = bleed(
    "#ffffff",
    "0 40px 96px",
    [
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        modernFeatureCard("Architecture", "Replace with a sentence about the building or setting.", "Architecture"),
        modernFeatureCard("Service", "Replace with a sentence about the hospitality style.", "Service"),
        modernFeatureCard("Location", "Replace with a sentence about what's nearby.", "Location"),
      ]),
    ],
    "1160px",
    "0",
  );

  const review = bleed(
    MODERN.ink,
    "80px 40px",
    [
      mk("text", { content: "★★★★★  REPLACE WITH A REAL AVERAGE RATING" }, { fontSize: "13px", fontWeight: "700", color: MODERN.accent, textAlign: "center", letterSpacing: "0.06em" }),
      heading("“Replace with a real guest review — one honest sentence about the stay.”", { size: "26px", color: "#ffffff", align: "center", font: MODERN.font, weight: "500" }),
      body("Replace with a name, or “Verified guest”", { size: "14px", color: "#8A93A3", align: "center" }),
    ],
    "700px",
    "14px",
  );

  // A real two-stop gradient, not a flat fill — `gradientFrom`/`gradientTo`
  // (registry.tsx) turn what used to be another solid-color band into
  // something with actual depth.
  const finalCta = bleed(
    MODERN.accentDeep,
    "72px 40px",
    [
      heading("Replace with a closing invitation to book", { size: "32px", color: "#ffffff", align: "center", font: MODERN.font }),
      body("Replace with a supporting sentence.", { size: "16px", color: "#D7DCE3", align: "center" }),
      cta("Check availability", { background: "#ffffff", color: MODERN.accentDeep }),
    ],
    "620px",
    "16px",
    { animation: "scale-in" },
    { gradientFrom: MODERN.ink, gradientTo: MODERN.accentDeep, gradientAngle: "120" },
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: MODERN.paper, gap: "0" }, [
      modernNav("Home"),
      hero,
      roomTeaser,
      welcome,
      features,
      review,
      finalCta,
      modernFooter(),
    ]),
  };
}

type RoomSeed = { name: string; description: string };

export function hotelModernRoomsTemplate(): PageContent {
  const heroBlock = modernPageHero("Replace with a rooms-page headline", "Replace with a sentence framing the room categories below.");

  const rooms: RoomSeed[] = [
    { name: "Ocean Room", description: "Replace with a description of the entry room category — size, view, bed configuration." },
    { name: "Terrace Suite", description: "Replace with a description of the mid-tier room category." },
    { name: "Penthouse", description: "Replace with a description of the top-tier room category." },
  ];
  const roomSwitcher = bleed(
    MODERN.paper,
    "88px 40px",
    [
      heading("Room categories", { size: "32px", color: MODERN.text, align: "center", font: MODERN.font }),
      mk(
        "contentSwitcher",
        { items: rooms.map((r) => ({ id: randomUUID(), label: r.name, image: "https://placehold.co/900x650", description: r.description })) },
        { activeColor: MODERN.text, inactiveColor: MODERN.textFaint, imageAspectRatio: "3 / 2", animation: "fade-in" },
      ),
    ],
    "1000px",
    "32px",
  );

  const included = bleed(
    "#ffffff",
    "88px 40px",
    [
      heading("Included with every room", { size: "30px", color: MODERN.text, align: "center", font: MODERN.font }),
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        modernFeatureCard("Replace with amenity one", "Replace with a short description.", "Amenity"),
        modernFeatureCard("Replace with amenity two", "Replace with a short description.", "Amenity"),
        modernFeatureCard("Replace with amenity three", "Replace with a short description.", "Amenity"),
      ]),
    ],
    "1100px",
    "24px",
  );

  const finalCta = bleed(MODERN.ink, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: "#ffffff", align: "center", font: MODERN.font }), cta("Check availability", { background: "#ffffff", color: MODERN.ink })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: MODERN.paper, gap: "0" }, [modernNav("Rooms"), heroBlock, roomSwitcher, included, finalCta, modernFooter()]),
  };
}

export function hotelModernAmenitiesTemplate(): PageContent {
  const heroBlock = modernPageHero("Replace with an amenities-page headline", "Replace with a sentence framing the gallery below.");

  const galleryBlock = bleed(
    MODERN.paper,
    "88px 40px",
    [
      mk(
        "gallery",
        {
          images: [
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Pool", caption: "Pool" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Spa", caption: "Spa" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Restaurant", caption: "Restaurant" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Fitness room", caption: "Fitness Room" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Terrace", caption: "Terrace" },
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
    "#ffffff",
    "88px 40px",
    [
      heading("On-site amenities", { size: "30px", color: MODERN.text, align: "center", font: MODERN.font }),
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        modernFeatureCard("Replace with amenity one", "Replace with a short description.", "Amenity"),
        modernFeatureCard("Replace with amenity two", "Replace with a short description.", "Amenity"),
        modernFeatureCard("Replace with amenity three", "Replace with a short description.", "Amenity"),
      ]),
    ],
    "1100px",
    "24px",
  );

  const finalCta = bleed(MODERN.accentDeep, "72px 40px", [heading("Replace with a closing invitation to book", { size: "30px", color: "#ffffff", align: "center", font: MODERN.font }), cta("Check availability", { background: "#ffffff", color: MODERN.accentDeep })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: MODERN.paper, gap: "0" }, [modernNav("Amenities"), heroBlock, galleryBlock, amenityList, finalCta, modernFooter()]),
  };
}

export function hotelModernContactTemplate(): PageContent {
  const heroBlock = modernPageHero("Replace with a contact/booking headline", "Replace with a sentence about response time or what to expect when booking.");

  const formSection = bleed(
    MODERN.paper,
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
          mk("section", { layout: "stack" }, { background: "#ffffff", padding: "32px", borderRadius: "12px", gap: "16px", borderColor: MODERN.border }, [
            heading("Replace with contact details", { size: "20px", color: MODERN.text, font: MODERN.font }),
            body("Replace with an email address.", { size: "15px", color: MODERN.textFaint }),
            body("Replace with a phone number (optional).", { size: "15px", color: MODERN.textFaint }),
            body("Replace with a physical address.", { size: "15px", color: MODERN.textFaint }),
          ]),
        ],
      ),
    ],
    "1000px",
    "0",
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: MODERN.paper, gap: "0" }, [modernNav("Contact"), heroBlock, formSection, modernFooter()]),
  };
}
