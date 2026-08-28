import type { Block, PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";
import { mk, heading, body, cta, bleed, badge } from "./_shared";

// Agency / creative services genre — docs/site-templates-plan.md Phase B.
// Palette: near-black ink + one loud signal-orange accent on a warm
// off-white paper — high-contrast, portfolio-forward register (reference:
// docs/reference-sites-research.md's Heretic/Métier entries), deliberately
// not a recolor of SaaS's indigo/Space Grotesk system. Fraunces (an
// editorial serif already curated in FONT_STACKS) carries the confident,
// gallery-catalog display voice Heretic/Métier both lean on; body copy
// stays on the theme default sans so the serif reads as a considered
// display choice rather than an all-over affectation.
//
// Same per-page nav/footer duplication rationale as saas.ts: a page
// template only ever produces draftContent for one Page, so baking an
// identical nav/footer block into every page this genre creates is what
// makes the result read as one cohesive site. All copy is deliberately
// generic/placeholder — never a fabricated real client, metric, or quote.
const AGENCY = {
  ink: "#0A0A0A",
  inkMuted: "#A3A3A3",
  paper: "#F5F3EE",
  paperDim: "#EAE6DC",
  text: "#151513",
  textFaint: "#6B6862",
  accent: "#FF4B12",
  accentSoft: "#FFE4D9",
  border: "#DEDACD",
  font: "fraunces",
} as const;

function agencyNav(active: string): Block {
  const links = ["Home", "Work", "Services", "About", "Contact"];
  return mk(
    "section",
    { layout: "row" },
    { background: AGENCY.paper, padding: "20px 40px", justify: "space-between", align: "center", borderRadius: "0" },
    [
      body("Studio name", { size: "16px", weight: "700", color: AGENCY.text, font: AGENCY.font }),
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", gap: "28px", align: "center" },
        links.map((l) => body(l, { size: "14px", weight: l === active ? "700" : "400", color: l === active ? AGENCY.accent : AGENCY.textFaint })),
      ),
    ],
  );
}

function agencyFooter(): Block {
  return bleed(
    AGENCY.ink,
    "56px 40px",
    [
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", justify: "space-between", align: "center" },
        [
          body("Studio name", { size: "15px", weight: "700", color: "#F5F3EE", font: AGENCY.font }),
          body("Replace with a real copyright line and links.", { size: "13px", color: AGENCY.inkMuted }),
        ],
      ),
    ],
    "1100px",
    "0",
  );
}

function agencyPageHero(eyebrow: string, title: string, sub: string): Block {
  return bleed(
    AGENCY.ink,
    "80px 40px 72px",
    [
      body(eyebrow, { size: "13px", weight: "700", color: AGENCY.accent, align: "center" }),
      heading(title, { size: "46px", color: "#F5F3EE", align: "center", level: "h1", font: AGENCY.font }),
      body(sub, { size: "17px", color: AGENCY.inkMuted, align: "center" }),
    ],
    "680px",
    "16px",
    { animation: "fade-in" },
  );
}

type AccordionSeed = { q: string; a: string };

function agencyFaq(): Block {
  const items: AccordionSeed[] = [
    { q: "Replace with a real engagement-process question.", a: "Replace with the answer — keep it short and specific." },
    { q: "Replace with a real timeline question.", a: "Replace with the answer." },
    { q: "Replace with a real pricing/scope question.", a: "Replace with the answer." },
    { q: "Replace with a real ownership/IP question.", a: "Replace with the answer." },
  ];
  return mk(
    "accordion",
    { items: items.map((i) => ({ id: randomUUID(), question: i.q, answer: i.a })), allowMultiple: "" },
    { titleColor: AGENCY.text, contentColor: AGENCY.textFaint, borderColor: AGENCY.border, fontSize: "17px", animation: "fade-in" },
  );
}

function agencyLogoMarquee(): Block {
  const names = ["Client A", "Client B", "Client C", "Client D", "Client E", "Client F"];
  return mk(
    "marquee",
    { speed: "24", direction: "left", pauseOnHover: "true" },
    { gap: "56px", animation: "fade-in" },
    names.map((n) => body(n, { size: "18px", weight: "600", color: AGENCY.inkMuted })),
  );
}

// Always dropped onto a dark AGENCY.ink band in this template — light
// values, not AGENCY.text/textFaint, or the numbers are invisible against
// the dark background (docs/site-templates-plan.md's checklist item 1,
// found live while building the SaaS template).
function agencyStatRow(stats: { value: string; suffix: string; label: string }[]): Block {
  return mk(
    "columns",
    { columns: String(stats.length) },
    { gap: "24px", animation: "fade-in" },
    stats.map((s) =>
      mk("statCounter", { value: s.value, prefix: "", suffix: s.suffix, label: s.label }, { valueColor: "#F5F3EE", valueFontSize: "40px", labelColor: AGENCY.inkMuted, align: "center" }),
    ),
  );
}

type WorkItemSeed = { name: string; blurb: string };

// Portfolio grid — contentSwitcher (docs/site-templates-plan.md calls out
// contentSwitcher or list+imageOverlay; contentSwitcher matches this
// genre's "click a project name, see the shot" gallery-catalog feel and
// its exact prop shape is already proven working by saas.ts's team
// section). Items are numbered in their placeholder label per checklist
// item 2 — three identical "Replace with a name" rows make the switcher's
// own list unreadable.
function agencyWorkSwitcher(items: WorkItemSeed[]): Block {
  return mk(
    "contentSwitcher",
    { items: items.map((w) => ({ id: randomUUID(), label: w.name, image: "https://placehold.co/900x1125", description: w.blurb })) },
    { activeColor: AGENCY.text, inactiveColor: AGENCY.inkMuted, imageAspectRatio: "4 / 5", gap: "40px", animation: "fade-in" },
  );
}

export function agencyHomeTemplate(): PageContent {
  // Real `hero` block with a real backgroundImage (a work-sample photo) —
  // not a hand-rolled bleed() with a CSS gradient. `section`'s
  // `background` style key maps to CSS `background-color`, which cannot
  // hold a gradient or url() — a prior pass's diagonal-wedge gradient
  // through `bleed()` never actually rendered, caught on re-inspection.
  // `hero`'s own `backgroundImage` prop composites the photo with a
  // built-in dark scrim for legible text — exactly what a portfolio-led
  // studio's hero should show first. No eyebrow label (impeccable
  // craft-floor: the heading carries the statement).
  const hero = mk(
    "hero",
    { backgroundImage: "https://placehold.co/1800x1200/0A0A0A/FF4B12?text=" },
    { background: AGENCY.ink, padding: "120px 40px 100px", contentWidth: "760px", align: "center", gap: "22px", backgroundTexture: "grain" },
    [
      badge("Available for new projects", { tone: "success" }),
      heading("Replace with a bold statement of what this studio makes.", { size: "64px", color: "#F5F3EE", align: "center", level: "h1", font: AGENCY.font, animation: "slide-up" }),
      body("Replace with a supporting sentence naming who you work with and what kind of work you make for them.", { size: "18px", color: AGENCY.inkMuted, align: "center" }),
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "12px", justify: "center", animation: "fade-in" }, [
        cta("See our work", { background: AGENCY.accent, color: "#ffffff" }),
        cta("Start a project", { background: "transparent", color: "#F5F3EE", variant: "secondary" }),
      ]),
    ],
  );

  const logos = bleed(AGENCY.paper, "40px 40px", [body("Trusted by teams at", { size: "12px", weight: "700", color: AGENCY.textFaint, align: "center" }), agencyLogoMarquee()], "1100px", "20px");

  const featuredWork = bleed(
    AGENCY.paper,
    "96px 40px",
    [
      heading("Selected work", { size: "34px", color: AGENCY.text, align: "center", font: AGENCY.font }),
      body("Replace with one sentence framing the range of work shown below.", { size: "16px", color: AGENCY.textFaint, align: "center" }),
      agencyWorkSwitcher([
        { name: "Replace with project name 1", blurb: "Replace with a one-line description of the work and outcome." },
        { name: "Replace with project name 2", blurb: "Replace with a one-line description of the work and outcome." },
        { name: "Replace with project name 3", blurb: "Replace with a one-line description of the work and outcome." },
      ]),
      cta("View all work", { background: AGENCY.ink, color: "#ffffff" }),
    ],
    "1000px",
    "24px",
  );

  const serviceCard = (title: string, copy: string, featured = false): Block =>
    mk(
      "section",
      { layout: "stack" },
      { background: featured ? AGENCY.paper : "#ffffff", padding: featured ? "40px" : "32px", borderRadius: "16px", gap: "12px", align: "flex-start", borderColor: AGENCY.border, animation: "slide-up" },
      [heading(title, { size: featured ? "26px" : "19px", color: AGENCY.text, font: AGENCY.font }), body(copy, { size: featured ? "16px" : "15px", color: AGENCY.textFaint })],
    );

  // One wide featured service on top, two narrower below — a different
  // asymmetric shape from the signature-dishes split in restaurant.ts
  // (large-beside-stacked there, wide-then-pair here), so this project's
  // own "distinct devices per genre" rule extends to layout, not only
  // the uniform 3-equal-column grid this codebase otherwise defaults to.
  const services = bleed(
    "#ffffff",
    "96px 40px",
    [
      heading("What we do", { size: "34px", color: AGENCY.text, align: "center", font: AGENCY.font }),
      body("Replace with one sentence about how these services fit together.", { size: "16px", color: AGENCY.textFaint, align: "center" }),
      mk("section", { layout: "stack" }, { background: "transparent", padding: "0", maxWidth: "1100px", gap: "24px" }, [
        serviceCard("Replace with your primary service", "Replace with a short description of the core offering.", true),
        mk("columns", { columns: "2" }, { gap: "24px" }, [
          serviceCard("Replace with service two", "Replace with a short description."),
          serviceCard("Replace with service three", "Replace with a short description."),
        ]),
      ]),
    ],
    "760px",
    "16px",
  );

  const quote = bleed(
    AGENCY.paper,
    "88px 40px",
    [
      heading("“Replace with a short client quote about working with the studio.”", { size: "28px", color: AGENCY.text, align: "center", font: AGENCY.font, weight: "500", animation: "fade-in" }),
      body("Replace with a name, role", { size: "14px", color: AGENCY.textFaint, align: "center" }),
    ],
    "760px",
    "16px",
  );

  const finalCta = bleed(
    AGENCY.accent,
    "72px 40px",
    [
      heading("Replace with a closing call to action", { size: "32px", color: "#ffffff", align: "center", font: AGENCY.font }),
      body("Replace with a supporting sentence.", { size: "16px", color: AGENCY.accentSoft, align: "center" }),
      cta("Start a project", { background: "#ffffff", color: AGENCY.accent }),
    ],
    "620px",
    "16px",
    { animation: "scale-in" },
  );

  return {
    version: 1,
    // Work moved directly after the hero and the client quote moved up
    // beside it — a creative studio sells on portfolio strength first
    // (docs/reference-sites-research.md's Heretic/Métier entries both lead
    // hard with work). Team/founding stats now live only on the About page
    // — they read as generic B2B credibility furniture on a portfolio-led
    // homepage, not what a prospective client is scanning for first.
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [
      agencyNav("Home"),
      hero,
      featuredWork,
      quote,
      logos,
      services,
      finalCta,
      agencyFooter(),
    ]),
  };
}

export function agencyWorkTemplate(): PageContent {
  const heroBlock = agencyPageHero("Work", "Replace with a portfolio-page headline", "Replace with a sentence framing the range of projects below.");

  const grid = bleed(
    "#ffffff",
    "88px 40px 96px",
    [
      agencyWorkSwitcher([
        { name: "Replace with project name 1", blurb: "Replace with the client, the brief, and the outcome in one or two sentences." },
        { name: "Replace with project name 2", blurb: "Replace with the client, the brief, and the outcome in one or two sentences." },
        { name: "Replace with project name 3", blurb: "Replace with the client, the brief, and the outcome in one or two sentences." },
        { name: "Replace with project name 4", blurb: "Replace with the client, the brief, and the outcome in one or two sentences." },
        { name: "Replace with project name 5", blurb: "Replace with the client, the brief, and the outcome in one or two sentences." },
      ]),
    ],
    "1000px",
    "0",
  );

  const gridSection = mk(
    "section",
    { layout: "stack" },
    { background: AGENCY.paper, padding: "88px 40px", align: "center", gap: "24px" },
    [
      mk("section", { layout: "stack" }, { background: "transparent", padding: "0", maxWidth: "1200px", align: "center", gap: "16px" }, [
        heading("More projects", { size: "30px", color: AGENCY.text, align: "center", font: AGENCY.font }),
        body("Replace with a sentence about how projects are organized (by discipline, industry, or year).", { size: "15px", color: AGENCY.textFaint, align: "center" }),
        mk("list", { collectionId: "", columns: "3" }, { display: "grid", gap: "24px", animation: "fade-in" }, [
          mk("imageOverlay", { src: "https://placehold.co/700x525", alt: "", caption: "Replace with project name 6" }, { captionPosition: "bottom", overlayOpacity: "0.55", aspectRatio: "4 / 3", borderRadius: "12px" }),
          mk("imageOverlay", { src: "https://placehold.co/700x525", alt: "", caption: "Replace with project name 7" }, { captionPosition: "bottom", overlayOpacity: "0.55", aspectRatio: "4 / 3", borderRadius: "12px" }),
          mk("imageOverlay", { src: "https://placehold.co/700x525", alt: "", caption: "Replace with project name 8" }, { captionPosition: "bottom", overlayOpacity: "0.55", aspectRatio: "4 / 3", borderRadius: "12px" }),
        ]),
      ]),
    ],
  );

  const finalCta = bleed(AGENCY.ink, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: "#F5F3EE", align: "center", font: AGENCY.font }), cta("Start a project", { background: AGENCY.accent, color: "#ffffff" })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [agencyNav("Work"), heroBlock, grid, gridSection, finalCta, agencyFooter()]),
  };
}

export function agencyServicesTemplate(): PageContent {
  const heroBlock = agencyPageHero("Services", "Replace with a services-page headline", "Replace with a sentence framing the services detailed below.");

  const serviceRow = (eyebrow: string, title: string, copy: string, reverse: boolean): Block =>
    mk(
      "columns",
      { columns: "2" },
      { gap: "48px", align: "center" },
      reverse
        ? [
            mk("imageOverlay", { src: "https://placehold.co/700x500", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 3", borderRadius: "16px", animation: "slide-right" }),
            mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "12px", animation: "slide-left" }, [
              body(eyebrow, { size: "12px", weight: "700", color: AGENCY.accent }),
              heading(title, { size: "26px", color: AGENCY.text, font: AGENCY.font }),
              body(copy, { size: "16px", color: AGENCY.textFaint }),
            ]),
          ]
        : [
            mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "12px", animation: "slide-right" }, [
              body(eyebrow, { size: "12px", weight: "700", color: AGENCY.accent }),
              heading(title, { size: "26px", color: AGENCY.text, font: AGENCY.font }),
              body(copy, { size: "16px", color: AGENCY.textFaint }),
            ]),
            mk("imageOverlay", { src: "https://placehold.co/700x500", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 3", borderRadius: "16px", animation: "slide-left" }),
          ],
    );

  const rows = bleed(
    "#ffffff",
    "88px 40px",
    [
      serviceRow("Replace with a label", "Replace with service headline one", "Replace with a paragraph describing this service in more depth than the home page allows.", false),
      serviceRow("Replace with a label", "Replace with service headline two", "Replace with a paragraph describing this service in more depth than the home page allows.", true),
      serviceRow("Replace with a label", "Replace with service headline three", "Replace with a paragraph describing this service in more depth than the home page allows.", false),
    ],
    "1100px",
    "72px",
  );

  const processStep = (num: string, title: string, copy: string): Block =>
    mk(
      "section",
      { layout: "stack" },
      { background: "transparent", padding: "0", gap: "10px", align: "flex-start", animation: "slide-up" },
      [body(num, { size: "13px", weight: "700", color: AGENCY.accent }), heading(title, { size: "19px", color: AGENCY.text, font: AGENCY.font }), body(copy, { size: "15px", color: AGENCY.textFaint })],
    );

  const process = bleed(
    AGENCY.paper,
    "88px 40px",
    [
      heading("How we work", { size: "32px", color: AGENCY.text, align: "center", font: AGENCY.font }),
      mk("section", { layout: "stack" }, { background: "transparent", padding: "0", maxWidth: "1100px", gap: "0" }, [
        mk("columns", { columns: "4" }, { gap: "24px" }, [
          processStep("01", "Replace with step one", "Replace with a short description."),
          processStep("02", "Replace with step two", "Replace with a short description."),
          processStep("03", "Replace with step three", "Replace with a short description."),
          processStep("04", "Replace with step four", "Replace with a short description."),
        ]),
      ]),
    ],
    "760px",
    "40px",
  );

  const faq = bleed("#ffffff", "88px 40px", [heading("Engagement questions", { size: "30px", color: AGENCY.text, align: "center", font: AGENCY.font }), agencyFaq()], "760px", "24px");

  const finalCta = bleed(AGENCY.accent, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: "#ffffff", align: "center", font: AGENCY.font }), cta("Start a project", { background: "#ffffff", color: AGENCY.accent })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [agencyNav("Services"), heroBlock, rows, process, faq, finalCta, agencyFooter()]),
  };
}

type TeamSeed = { name: string; role: string };

export function agencyAboutTemplate(): PageContent {
  const heroBlock = agencyPageHero("About", "Replace with why this studio exists", "Replace with two or three sentences about the studio's philosophy — enough to build trust, not a full history.");

  const mission = bleed(
    "#ffffff",
    "80px 40px",
    [
      heading("Replace with your studio's mission statement", { size: "28px", color: AGENCY.text, align: "center", font: AGENCY.font, animation: "fade-in" }),
      body("Replace with a longer paragraph about how the studio approaches the work it makes.", { size: "17px", color: AGENCY.textFaint, align: "center" }),
    ],
    "700px",
    "16px",
  );

  const stats = bleed(AGENCY.ink, "64px 40px", [agencyStatRow([
    { value: "2016", suffix: "", label: "Founded" },
    { value: "18", suffix: "", label: "Team members" },
    { value: "6", suffix: "", label: "Disciplines" },
  ])], "1000px", "0");

  const team: TeamSeed[] = [
    { name: "Replace with name 1", role: "Replace with a role" },
    { name: "Replace with name 2", role: "Replace with a role" },
    { name: "Replace with name 3", role: "Replace with a role" },
  ];
  const teamSection = bleed(
    AGENCY.paper,
    "88px 40px",
    [
      heading("Studio", { size: "30px", color: AGENCY.text, align: "center", font: AGENCY.font }),
      mk(
        "contentSwitcher",
        { items: team.map((t) => ({ id: randomUUID(), label: t.name, image: "https://placehold.co/600x750", description: t.role })) },
        { activeColor: AGENCY.text, inactiveColor: AGENCY.inkMuted, imageAspectRatio: "4 / 5", animation: "fade-in" },
      ),
    ],
    "900px",
    "32px",
  );

  const finalCta = bleed(AGENCY.accent, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: "#ffffff", align: "center", font: AGENCY.font }), cta("Get in touch", { background: "#ffffff", color: AGENCY.accent })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [agencyNav("About"), heroBlock, mission, stats, teamSection, finalCta, agencyFooter()]),
  };
}

export function agencyContactTemplate(): PageContent {
  const heroBlock = agencyPageHero("Contact", "Replace with a contact-page headline", "Replace with a sentence about response time or what to expect from a first conversation.");

  const formSection = bleed(
    "#ffffff",
    "72px 40px 96px",
    [
      mk(
        "columns",
        { columns: "2" },
        { gap: "56px", align: "flex-start", animation: "fade-in" },
        [
          mk(
            "form",
            {
              fields: [
                { id: randomUUID(), type: "text", label: "Name", required: true },
                { id: randomUUID(), type: "email", label: "Email", required: true },
                { id: randomUUID(), type: "textarea", label: "Project details", required: true },
              ],
              submitLabel: "Send message",
              onSubmit: { action: "storeOnly" },
            },
            { padding: "0" },
          ),
          mk("section", { layout: "stack" }, { background: AGENCY.paper, padding: "32px", borderRadius: "16px", gap: "16px" }, [
            heading("Replace with contact details", { size: "20px", color: AGENCY.text, font: AGENCY.font }),
            body("Replace with an email address.", { size: "15px", color: AGENCY.textFaint }),
            body("Replace with a phone number (optional).", { size: "15px", color: AGENCY.textFaint }),
            body("Replace with a studio address (optional).", { size: "15px", color: AGENCY.textFaint }),
          ]),
        ],
      ),
    ],
    "1000px",
    "0",
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [agencyNav("Contact"), heroBlock, formSection, agencyFooter()]),
  };
}
