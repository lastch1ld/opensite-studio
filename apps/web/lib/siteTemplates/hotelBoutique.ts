import type { Block, PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";
import { mk, heading, body, cta, bleed, badge, heroPhotoPlaceholder } from "./_shared";

// Hotel — Boutique genre. One of three new hotel registers (see
// hotelModern.ts's file comment for the full context) — reference:
// Toscana ("Boutique Stays in Tuscany" — a full-bleed landscape photo
// hero, warm cream paper, a recurring ARCH shape used twice — once as a
// literal rounded-top photo crop, once as a rounded-top accent card
// overlapping a photo — and an asymmetric offset photo collage instead
// of a uniform grid).
// Palette: warm parchment cream + deep olive-green + a secondary
// terracotta clay accent — a Mediterranean-villa register, distinct from
// every other genre and from this file's sibling hotel registers
// (Modern's cool steel-blue, Resort's dark ink + gold). Instrument Serif
// carries the display headline for its slightly classical, editorial
// optical quality — matches Toscana's own condensed display serif more
// closely than Fraunces' heavier text-weight-forward voice.
const BOUTIQUE = {
  ink: "#2B2318",
  paper: "#F5EFE2",
  paperDim: "#EBE1CB",
  text: "#2B2318",
  // Deepened to clear WCAG AA 4.5:1 on both paper (#F5EFE2, was 4.32:1)
  // and paperDim (#EBE1CB, was 3.81:1) -- one value covers both.
  textFaint: "#6E634C",
  accent: "#3F5B45",
  accentDeep: "#28392C",
  // Deepened so it works both as 14px bold on paper (was 3.42:1) and as a
  // filled band behind #F7E4D6 body copy (was 3.18:1).
  terracotta: "#A64E24",
  border: "#E1D4B5",
  font: "instrument-serif",
} as const;

// The arch — a rounded-top rectangle — is this genre's one recurring,
// literal structural device (matches Toscana's own repeated arch crop
// and arch accent card), not just a palette choice. Any tall image with
// `borderRadius: "999px 999px 0 0"` reads as an arch; used on the hero
// welcome photo, the suite cards, and the amenities photo below.
const ARCH = "999px 999px 0 0";

function boutiqueNav(active: string): Block {
  const links = ["Home", "Rooms", "Amenities", "Contact"];
  return mk(
    "section",
    { layout: "row" },
    { background: BOUTIQUE.paper, padding: "24px 40px", justify: "space-between", align: "center" },
    [
      body("Hotel name", { size: "17px", weight: "600", color: BOUTIQUE.text, font: BOUTIQUE.font }),
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", gap: "28px", align: "center" },
        links.map((l) => body(l, { size: "14px", weight: l === active ? "700" : "400", color: l === active ? BOUTIQUE.accent : BOUTIQUE.textFaint })),
      ),
    ],
  );
}

function boutiqueFooter(): Block {
  return bleed(
    BOUTIQUE.ink,
    "56px 40px",
    [
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", justify: "space-between", align: "center" },
        [
          body("Hotel name", { size: "15px", weight: "600", color: BOUTIQUE.paper, font: BOUTIQUE.font }),
          body("Replace with a real copyright line and links.", { size: "13px", color: "#A69A80" }),
        ],
      ),
    ],
    "1100px",
    "0",
  );
}

function boutiquePageHero(title: string, sub: string): Block {
  return mk(
    "hero",
    { backgroundImage: heroPhotoPlaceholder(BOUTIQUE.accent) },
    { background: BOUTIQUE.ink, padding: "72px 40px", contentWidth: "700px", align: "center", gap: "16px", minHeight: "42vh" },
    [
      heading(title, { size: "42px", color: BOUTIQUE.paper, align: "center", level: "h1", weight: "400", font: BOUTIQUE.font, animation: "slide-up" }),
      body(sub, { size: "17px", color: "#D9CDB0", align: "center" }),
    ],
  );
}

type SuiteSeed = { name: string; rate: string; description: string };

function boutiqueSuiteCard(s: SuiteSeed): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: "transparent", padding: "0", gap: "12px", align: "flex-start", animation: "slide-up" },
    [
      mk("imageOverlay", { src: "https://placehold.co/600x750", alt: "Replace with a description of this image", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 5", borderRadius: ARCH }),
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", justify: "space-between", align: "center" }, [
        heading(s.name, { size: "19px", color: BOUTIQUE.text, font: BOUTIQUE.font, weight: "400" }),
        body(s.rate, { size: "14px", weight: "700", color: BOUTIQUE.terracotta }),
      ]),
      body(s.description, { size: "14px", color: BOUTIQUE.textFaint }),
    ],
  );
}

function boutiqueFeatureCard(title: string, copy: string): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background: BOUTIQUE.paperDim, padding: "30px", borderRadius: "8px", gap: "10px", align: "flex-start", animation: "slide-up" },
    [heading(title, { size: "19px", color: BOUTIQUE.text, font: BOUTIQUE.font, weight: "400" }), body(copy, { size: "15px", color: BOUTIQUE.textFaint })],
  );
}

function boutiqueAmenityMarquee(): Block {
  const items = ["Pool", "Library", "Concierge", "Vineyard Tours", "Spa", "Wine Cellar", "Garden Terrace", "Breakfast"];
  return mk(
    "marquee",
    { speed: "22", direction: "left", pauseOnHover: "true" },
    { gap: "48px", animation: "fade-in" },
    items.map((n) => body(n, { size: "20px", weight: "400", color: BOUTIQUE.textFaint, font: BOUTIQUE.font })),
  );
}

export function hotelBoutiqueHomeTemplate(): PageContent {
  const hero = mk(
    "hero",
    { backgroundImage: heroPhotoPlaceholder(BOUTIQUE.accent) },
    { background: BOUTIQUE.ink, padding: "56px 40px", contentWidth: "820px", align: "center", verticalAlign: "center", gap: "18px", minHeight: "78vh" },
    [
      badge("● Available for new stays", { tone: "success" }),
      heading("With a view to the Italian soul.", { size: "68px", color: BOUTIQUE.paper, level: "h1", weight: "400", font: BOUTIQUE.font, align: "center", animation: "slide-up" }),
      body("Replace with a sentence about the setting — the hills, the vineyards, the pace of a stay here.", { size: "17px", color: "#D9CDB0", align: "center" }),
      cta("Read more", { background: BOUTIQUE.paper, color: BOUTIQUE.ink }),
    ],
  );

  const welcome = bleed(
    BOUTIQUE.paper,
    "96px 40px",
    [
      mk(
        "columns",
        { columns: "2" },
        { gap: "48px", align: "center" },
        [
          mk("imageOverlay", { src: "https://placehold.co/700x850", alt: "Replace with a description of this image", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 5", borderRadius: ARCH, animation: "slide-right" }),
          mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "18px", align: "flex-start", animation: "slide-left" }, [
            heading("Welcome to Hotel name, where timeless elegance meets modern comfort.", { size: "34px", color: BOUTIQUE.text, font: BOUTIQUE.font, weight: "400" }),
            body("Replace with two or three sentences about the setting and what makes a stay here different.", { size: "16px", color: BOUTIQUE.textFaint }),
            cta("Read more", { background: "transparent", color: BOUTIQUE.accent, variant: "secondary" }),
          ]),
        ],
      ),
    ],
    "1160px",
    "0",
  );

  const marquee = mk("section", { layout: "stack" }, { background: BOUTIQUE.paperDim, padding: "28px 0" }, [boutiqueAmenityMarquee()]);

  const suites = bleed(
    BOUTIQUE.paper,
    "96px 40px",
    [
      heading("Suites", { size: "32px", color: BOUTIQUE.text, align: "center", font: BOUTIQUE.font, weight: "400" }),
      body("Replace with a sentence framing the categories below — see the full Rooms page for details.", { size: "16px", color: BOUTIQUE.textFaint, align: "center" }),
      mk("columns", { columns: "3" }, { gap: "28px" }, [
        boutiqueSuiteCard({ name: "Classic Room", rate: "Replace with a rate", description: "Replace with a description — size, view, bed configuration." }),
        boutiqueSuiteCard({ name: "Vineyard Suite", rate: "Replace with a rate", description: "Replace with a description." }),
        boutiqueSuiteCard({ name: "Villa Suite", rate: "Replace with a rate", description: "Replace with a description." }),
      ]),
      cta("View all rooms", { background: BOUTIQUE.accent, color: "#ffffff" }),
    ],
    "1160px",
    "24px",
  );

  const statement = bleed(
    BOUTIQUE.accent,
    "88px 40px",
    [
      heading("“Replace with a real guest review — one honest sentence about the stay.”", { size: "28px", color: "#ffffff", align: "center", font: BOUTIQUE.font, weight: "400" , animation: "scale-in" }),
      body("Replace with a name, or “Verified guest”", { size: "14px", color: "#D8E3D9", align: "center" }),
    ],
    "740px",
    "16px",
  );

  const finalCta = bleed(
    BOUTIQUE.terracotta,
    "72px 40px",
    [
      heading("Replace with a closing invitation to book", { size: "32px", color: "#ffffff", align: "center", font: BOUTIQUE.font, weight: "400" }),
      body("Replace with a supporting sentence.", { size: "16px", color: "#F7E4D6", align: "center" }),
      cta("Check availability", { background: "#ffffff", color: BOUTIQUE.terracotta }),
    ],
    "620px",
    "16px",
    { animation: "scale-in" },
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: BOUTIQUE.paper, gap: "0" }, [
      boutiqueNav("Home"),
      hero,
      welcome,
      marquee,
      suites,
      statement,
      finalCta,
      boutiqueFooter(),
    ]),
  };
}

type RoomSeed = { name: string; description: string };

export function hotelBoutiqueRoomsTemplate(): PageContent {
  const heroBlock = boutiquePageHero("Replace with a rooms-page headline", "Replace with a sentence framing the room categories below.");

  const rooms: RoomSeed[] = [
    { name: "Classic Room", description: "Replace with a description of the entry room category — size, view, bed configuration." },
    { name: "Vineyard Suite", description: "Replace with a description of the mid-tier room category." },
    { name: "Villa Suite", description: "Replace with a description of the top-tier room category." },
  ];
  const roomSwitcher = bleed(
    BOUTIQUE.paper,
    "88px 40px",
    [
      heading("Room categories", { size: "32px", color: BOUTIQUE.text, align: "center", font: BOUTIQUE.font, weight: "400" }),
      mk(
        "contentSwitcher",
        { items: rooms.map((r) => ({ id: randomUUID(), label: r.name, image: "https://placehold.co/900x650", description: r.description })) },
        { activeColor: BOUTIQUE.text, inactiveColor: BOUTIQUE.textFaint, imageAspectRatio: "3 / 2", animation: "fade-in" },
      ),
    ],
    "1000px",
    "32px",
  );

  const included = bleed(
    BOUTIQUE.paperDim,
    "88px 40px",
    [
      heading("Included with every stay", { size: "30px", color: BOUTIQUE.text, align: "center", font: BOUTIQUE.font, weight: "400" }),
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        boutiqueFeatureCard("Replace with amenity one", "Replace with a short description."),
        boutiqueFeatureCard("Replace with amenity two", "Replace with a short description."),
        boutiqueFeatureCard("Replace with amenity three", "Replace with a short description."),
      ]),
    ],
    "1100px",
    "24px",
  );

  const finalCta = bleed(BOUTIQUE.ink, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: BOUTIQUE.paper, align: "center", font: BOUTIQUE.font, weight: "400" }), cta("Check availability", { background: BOUTIQUE.paper, color: BOUTIQUE.ink })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: BOUTIQUE.paper, gap: "0" }, [boutiqueNav("Rooms"), heroBlock, roomSwitcher, included, finalCta, boutiqueFooter()]),
  };
}

export function hotelBoutiqueAmenitiesTemplate(): PageContent {
  const heroBlock = boutiquePageHero("Replace with an amenities-page headline", "Replace with a sentence framing the gallery below.");

  const archPhoto = bleed(
    BOUTIQUE.paper,
    "88px 40px 0",
    [mk("imageOverlay", { src: "https://placehold.co/1000x600", alt: "Replace with a description of this image", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "16 / 9", borderRadius: ARCH, animation: "scale-in" })],
    "1000px",
    "0",
  );

  const galleryBlock = bleed(
    BOUTIQUE.paper,
    "40px 40px 88px",
    [
      mk(
        "gallery",
        {
          images: [
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Pool", caption: "Pool" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Vineyard", caption: "Vineyard" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Wine cellar", caption: "Wine Cellar" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Garden terrace", caption: "Garden Terrace" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Library", caption: "Library" },
            { id: randomUUID(), src: "https://placehold.co/800x600", alt: "Breakfast room", caption: "Breakfast Room" },
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
    BOUTIQUE.paperDim,
    "88px 40px",
    [
      heading("On-site amenities", { size: "30px", color: BOUTIQUE.text, align: "center", font: BOUTIQUE.font, weight: "400" }),
      mk("columns", { columns: "3" }, { gap: "24px" }, [
        boutiqueFeatureCard("Replace with amenity one", "Replace with a short description."),
        boutiqueFeatureCard("Replace with amenity two", "Replace with a short description."),
        boutiqueFeatureCard("Replace with amenity three", "Replace with a short description."),
      ]),
    ],
    "1100px",
    "24px",
  );

  const finalCta = bleed(BOUTIQUE.terracotta, "72px 40px", [heading("Replace with a closing invitation to book", { size: "30px", color: "#ffffff", align: "center", font: BOUTIQUE.font, weight: "400" }), cta("Check availability", { background: "#ffffff", color: BOUTIQUE.terracotta })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: BOUTIQUE.paper, gap: "0" }, [boutiqueNav("Amenities"), heroBlock, archPhoto, galleryBlock, amenityList, finalCta, boutiqueFooter()]),
  };
}

export function hotelBoutiqueContactTemplate(): PageContent {
  const heroBlock = boutiquePageHero("Replace with a contact/booking headline", "Replace with a sentence about response time or what to expect when booking.");

  const formSection = bleed(
    BOUTIQUE.paper,
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
          mk("section", { layout: "stack" }, { background: BOUTIQUE.paperDim, padding: "32px", borderRadius: "8px", gap: "16px" }, [
            heading("Replace with contact details", { size: "20px", color: BOUTIQUE.text, font: BOUTIQUE.font, weight: "400" , animation: "fade-in" }),
            body("Replace with an email address.", { size: "15px", color: BOUTIQUE.textFaint }),
            body("Replace with a phone number (optional).", { size: "15px", color: BOUTIQUE.textFaint }),
            body("Replace with a physical address.", { size: "15px", color: BOUTIQUE.textFaint }),
          ]),
        ],
      ),
    ],
    "1000px",
    "0",
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: BOUTIQUE.paper, gap: "0" }, [boutiqueNav("Contact"), heroBlock, formSection, boutiqueFooter()]),
  };
}
