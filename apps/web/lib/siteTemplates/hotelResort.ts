import type { Block, PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";
import { mk, heading, body, cta, bleed, badge, heroPhotoPlaceholder } from "./_shared";

// Hotel — Resort genre. One of three new hotel registers (see
// hotelModern.ts's file comment for the full context) — reference: Luxen
// Resort ("Luxury Hotel & Resort" — a full-bleed tropical beachfront
// photo hero with a huge serif wordmark low in the frame, a gold accent
// CTA, an award-laurel + centered statement band, photo feature cards,
// and a dark warm-wood amenities band with small icon-style cards).
// Palette: near-black warm ink + a muted gold accent — the darkest,
// most "resort at night" register of the three new hotel templates,
// distinct from Modern's cool steel-blue-on-paper and Boutique's cream
// parchment. Fraunces carries the display headline (already used by
// Agency/Restaurant/Portfolio elsewhere in this codebase, but reads
// distinct here via color, scale, and the dark-ink context no other
// genre pairs it with).
const RESORT = {
  ink: "#151210",
  inkPanel: "#1E1A16",
  paper: "#FBF8F2",
  text: "#1B1712",
  textFaint: "#7A7166",
  accent: "#B68A3E",
  accentSoft: "#F1E4C8",
  border: "#3A332A",
  font: "fraunces",
} as const;

function resortNav(active: string): Block {
  const links = ["Home", "Rooms", "Amenities", "Contact"];
  return mk(
    "section",
    { layout: "row" },
    { background: RESORT.ink, padding: "22px 40px", justify: "space-between", align: "center" },
    [
      body("Resort name", { size: "17px", weight: "700", color: RESORT.paper, font: RESORT.font }),
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", gap: "28px", align: "center" },
        links.map((l) => body(l, { size: "14px", weight: l === active ? "700" : "400", color: l === active ? RESORT.accent : "#A79E8E" })),
      ),
    ],
  );
}

function resortFooter(): Block {
  return bleed(
    RESORT.ink,
    "56px 40px",
    [
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", justify: "space-between", align: "center" },
        [
          body("Resort name", { size: "15px", weight: "700", color: RESORT.paper, font: RESORT.font }),
          body("Replace with a real copyright line and links.", { size: "13px", color: "#7A7166" }),
        ],
      ),
    ],
    "1100px",
    "0",
    {},
    { borderColor: RESORT.border },
  );
}

function resortPageHero(title: string, sub: string): Block {
  return mk(
    "hero",
    { backgroundImage: heroPhotoPlaceholder(RESORT.accent) },
    { background: RESORT.ink, padding: "72px 40px", contentWidth: "700px", align: "center", gap: "16px", minHeight: "42vh" },
    [
      heading(title, { size: "42px", color: RESORT.paper, align: "center", level: "h1", font: RESORT.font }),
      body(sub, { size: "17px", color: "#B3A88F", align: "center" }),
    ],
  );
}

type RoomSeed = { name: string; description: string; rate: string };

function resortRoomCard(r: RoomSeed): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: "transparent", padding: "0", gap: "10px", align: "flex-start", animation: "slide-up" },
    [
      mk("imageOverlay", { src: "https://placehold.co/700x525", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 3", borderRadius: "8px" }),
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", justify: "space-between", align: "center" }, [
        heading(r.name, { size: "18px", color: RESORT.text, font: RESORT.font }),
        body(r.rate, { size: "14px", weight: "700", color: RESORT.accent }),
      ]),
      body(r.description, { size: "14px", color: RESORT.textFaint }),
    ],
  );
}

function resortAmenityCard(glyph: string, title: string, copy: string): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: "transparent", padding: "0", gap: "10px", align: "flex-start", animation: "slide-up" },
    [
      body(glyph, { size: "24px", color: RESORT.accent }),
      heading(title, { size: "18px", color: RESORT.paper, font: RESORT.font }),
      body(copy, { size: "14px", color: "#A79E8E" }),
    ],
  );
}

export function hotelResortHomeTemplate(): PageContent {
  const hero = mk(
    "hero",
    { backgroundImage: heroPhotoPlaceholder(RESORT.accent) },
    { background: RESORT.ink, padding: "56px 40px 72px", contentWidth: "820px", align: "center", verticalAlign: "flex-end", gap: "16px", minHeight: "90vh" },
    [
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "10px" }, [
        badge("WELCOME TO RESORT NAME", { tone: "neutral" }),
      ]),
      heading("Resort name", { size: "88px", color: RESORT.paper, level: "h1", font: RESORT.font, align: "center", animation: "slide-up" }),
      body("Replace with a sentence about beachfront stays, exceptional hospitality, and unforgettable moments.", { size: "18px", color: "#C7BDA6", align: "center" }),
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "12px", animation: "fade-in" }, [
        cta("Reserve a stay", { background: RESORT.accent, color: "#ffffff" }),
        cta("Explore rooms", { background: "transparent", color: RESORT.paper, variant: "secondary" }),
      ]),
    ],
  );

  const statement = bleed(
    RESORT.paper,
    "88px 40px",
    [
      body("★ ★ ★ World Travel Awards", { size: "13px", weight: "700", color: RESORT.accent, align: "center" }),
      heading("Replace with a statement about how every detail here is designed to deliver comfort, service, and unforgettable moments.", { size: "30px", color: RESORT.text, align: "center", font: RESORT.font }),
      cta("Discover more", { background: RESORT.ink, color: "#ffffff" }),
    ],
    "760px",
    "20px",
  );

  const feature = (title: string, copy: string, imgLabel: string): Block =>
    mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "12px", align: "flex-start", animation: "slide-up" }, [
      mk("imageOverlay", { src: `https://placehold.co/700x500?text=${encodeURIComponent(imgLabel)}`, alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 3", borderRadius: "8px" }),
      heading(title, { size: "19px", color: RESORT.text, font: RESORT.font }),
      body(copy, { size: "14px", color: RESORT.textFaint }),
    ]);

  const features = bleed(
    RESORT.paper,
    "0 40px 96px",
    [
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        feature("Luxury Suites", "Replace with a sentence about elegant accommodations and premium amenities.", "Suite"),
        feature("Personalized Service", "Replace with a sentence about dedicated hospitality staff.", "Service"),
        feature("Prime Location", "Replace with a sentence about the setting and nearby attractions.", "Location"),
      ]),
    ],
    "1160px",
    "0",
  );

  const amenities = bleed(
    RESORT.inkPanel,
    "88px 40px",
    [
      body("RESORT EXPERIENCES", { size: "12px", weight: "700", color: RESORT.accent, align: "center" }),
      heading("Best amenities for every stay", { size: "32px", color: RESORT.paper, align: "center", font: RESORT.font }),
      mk("columns", { columns: "4" }, { gap: "32px" }, [
        resortAmenityCard("≈", "Infinity Pool", "Replace with a sentence about the pool and poolside service."),
        resortAmenityCard("✺", "Signature Spa", "Replace with a sentence about spa and wellness treatments."),
        resortAmenityCard("⚘", "Fine Dining", "Replace with a sentence about the restaurant and cuisine."),
        resortAmenityCard("☾", "Evening Bar", "Replace with a sentence about the bar and evening experience."),
      ]),
    ],
    "1160px",
    "24px",
  );

  const roomTeaser = bleed(
    RESORT.paper,
    "96px 40px",
    [
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", justify: "space-between", align: "flex-end" }, [
        mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "6px", align: "flex-start" }, [
          body("RESORT ACCOMMODATIONS", { size: "12px", weight: "700", color: RESORT.accent }),
          heading("Rooms & rates", { size: "32px", color: RESORT.text, font: RESORT.font }),
        ]),
        cta("View all rooms", { background: RESORT.accent, color: "#ffffff" }),
      ]),
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        resortRoomCard({ name: "Ocean View Room", rate: "Replace with a rate", description: "Replace with a description — size, view, bed configuration." }),
        resortRoomCard({ name: "Beachfront Villa", rate: "Replace with a rate", description: "Replace with a description." }),
        resortRoomCard({ name: "Private Pool Suite", rate: "Replace with a rate", description: "Replace with a description." }),
      ]),
    ],
    "1160px",
    "28px",
  );

  const finalCta = bleed(
    RESORT.accent,
    "72px 40px",
    [
      heading("Replace with a closing invitation to book", { size: "32px", color: "#ffffff", align: "center", font: RESORT.font }),
      body("Replace with a supporting sentence.", { size: "16px", color: RESORT.accentSoft, align: "center" }),
      cta("Reserve a stay", { background: "#ffffff", color: RESORT.accent }),
    ],
    "620px",
    "16px",
    { animation: "scale-in" },
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: RESORT.paper, gap: "0" }, [
      resortNav("Home"),
      hero,
      statement,
      features,
      amenities,
      roomTeaser,
      finalCta,
      resortFooter(),
    ]),
  };
}

export function hotelResortRoomsTemplate(): PageContent {
  const heroBlock = resortPageHero("Replace with a rooms-page headline", "Replace with a sentence framing the room categories below.");

  const rooms = [
    { name: "Ocean View Room", description: "Replace with a description of the entry room category — size, view, bed configuration." },
    { name: "Beachfront Villa", description: "Replace with a description of the mid-tier room category." },
    { name: "Private Pool Suite", description: "Replace with a description of the top-tier room category." },
  ];
  const roomSwitcher = bleed(
    RESORT.paper,
    "88px 40px",
    [
      heading("Room categories", { size: "32px", color: RESORT.text, align: "center", font: RESORT.font }),
      mk(
        "contentSwitcher",
        { items: rooms.map((r) => ({ id: randomUUID(), label: r.name, image: "https://placehold.co/900x650", description: r.description })) },
        { activeColor: RESORT.text, inactiveColor: RESORT.textFaint, imageAspectRatio: "3 / 2", animation: "fade-in" },
      ),
    ],
    "1000px",
    "32px",
  );

  const included = bleed(
    RESORT.inkPanel,
    "88px 40px",
    [
      heading("Included with every room", { size: "30px", color: RESORT.paper, align: "center", font: RESORT.font }),
      mk("columns", { columns: "4" }, { gap: "24px" }, [
        resortAmenityCard("≈", "Replace with amenity one", "Replace with a short description."),
        resortAmenityCard("✺", "Replace with amenity two", "Replace with a short description."),
        resortAmenityCard("⚘", "Replace with amenity three", "Replace with a short description."),
        resortAmenityCard("☾", "Replace with amenity four", "Replace with a short description."),
      ]),
    ],
    "1160px",
    "24px",
  );

  const finalCta = bleed(RESORT.accent, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: "#ffffff", align: "center", font: RESORT.font }), cta("Reserve a stay", { background: "#ffffff", color: RESORT.accent })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: RESORT.paper, gap: "0" }, [resortNav("Rooms"), heroBlock, roomSwitcher, included, finalCta, resortFooter()]),
  };
}

export function hotelResortAmenitiesTemplate(): PageContent {
  const heroBlock = resortPageHero("Replace with an amenities-page headline", "Replace with a sentence framing the gallery below.");

  const galleryBlock = bleed(
    RESORT.paper,
    "88px 40px",
    [
      mk(
        "gallery",
        {
          images: [
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Infinity pool", caption: "Infinity Pool" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Spa", caption: "Signature Spa" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Restaurant", caption: "Fine Dining" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Bar", caption: "Evening Bar" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Beach", caption: "Private Beach" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Gardens", caption: "Gardens" },
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
    RESORT.inkPanel,
    "88px 40px",
    [
      heading("Resort amenities", { size: "30px", color: RESORT.paper, align: "center", font: RESORT.font }),
      mk("columns", { columns: "4" }, { gap: "24px" }, [
        resortAmenityCard("≈", "Replace with amenity one", "Replace with a short description."),
        resortAmenityCard("✺", "Replace with amenity two", "Replace with a short description."),
        resortAmenityCard("⚘", "Replace with amenity three", "Replace with a short description."),
        resortAmenityCard("☾", "Replace with amenity four", "Replace with a short description."),
      ]),
    ],
    "1160px",
    "24px",
  );

  const finalCta = bleed(RESORT.accent, "72px 40px", [heading("Replace with a closing invitation to book", { size: "30px", color: "#ffffff", align: "center", font: RESORT.font }), cta("Reserve a stay", { background: "#ffffff", color: RESORT.accent })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: RESORT.paper, gap: "0" }, [resortNav("Amenities"), heroBlock, galleryBlock, amenityList, finalCta, resortFooter()]),
  };
}

export function hotelResortContactTemplate(): PageContent {
  const heroBlock = resortPageHero("Replace with a contact/booking headline", "Replace with a sentence about response time or what to expect when booking.");

  const formSection = bleed(
    RESORT.paper,
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
                { id: randomUUID(), type: "text", label: "Adults", required: false },
                { id: randomUUID(), type: "textarea", label: "Special requests", required: false },
              ],
              submitLabel: "Reserve stay",
              onSubmit: { action: "storeOnly" },
            },
            { padding: "0" },
          ),
          mk("section", { layout: "stack" }, { background: RESORT.inkPanel, padding: "32px", borderRadius: "8px", gap: "16px" }, [
            heading("Replace with contact details", { size: "20px", color: RESORT.paper, font: RESORT.font }),
            body("Replace with an email address.", { size: "15px", color: "#A79E8E" }),
            body("Replace with a phone number (optional).", { size: "15px", color: "#A79E8E" }),
            body("Replace with a physical address.", { size: "15px", color: "#A79E8E" }),
          ]),
        ],
      ),
    ],
    "1000px",
    "0",
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: RESORT.paper, gap: "0" }, [resortNav("Contact"), heroBlock, formSection, resortFooter()]),
  };
}
