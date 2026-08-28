import type { Block, PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";
import { mk, heading, body, cta, bleed, badge } from "./_shared";

// Personal portfolio genre — docs/site-templates-plan.md.
// Palette: warm off-white paper + near-black charcoal ink + one restrained
// deep forest-green accent — a minimal, high-end-freelancer register
// distinct from the SaaS genre's near-black/vivid-indigo pairing (no
// shared hue, no shared display font). Reference:
// docs/reference-sites-research.md's Karolina Hess entry (huge two-line
// ~140px confident headline, warm light-gray body, deep forest-green CTA
// sections) and Métier entry (near-monochrome restraint, one accent used
// sparingly, single-family type confidence). Instrument Serif (already a
// curated FONT_STACKS entry) carries the display headline at a light
// weight — an editorial, unbolded confidence rather than SaaS's bold
// geometric sans — with the platform's default sans left for body copy so
// the type pairing itself reads restrained, not templated.
//
// Same per-page nav/footer duplication rationale as saas.ts: a page
// template only ever produces one Page's draftContent, so baking an
// identical nav/footer block into every page here is what makes the four
// pages read as one site. All copy is deliberately generic/placeholder —
// never a fabricated real name, project, or metric.
const PORTFOLIO = {
  ink: "#1C1B17",
  inkMuted: "#8A887F",
  paper: "#F4F2ED",
  paperAlt: "#EAE6DD",
  text: "#1C1B17",
  textFaint: "#6E6C63",
  accent: "#20493A",
  accentSoft: "#D8E3DA",
  border: "#DEDACF",
  font: "instrument-serif",
} as const;

function portfolioNav(active: string): Block {
  const links = ["Home", "Work", "About", "Contact"];
  return mk(
    "section",
    { layout: "row" },
    { background: PORTFOLIO.paper, padding: "24px 40px", justify: "space-between", align: "center", borderRadius: "0" },
    [
      body("Your name", { size: "16px", weight: "600", color: PORTFOLIO.text }),
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", gap: "32px", align: "center" },
        links.map((l) => body(l, { size: "14px", weight: l === active ? "700" : "400", color: l === active ? PORTFOLIO.accent : PORTFOLIO.textFaint })),
      ),
    ],
  );
}

function portfolioFooter(): Block {
  return bleed(
    PORTFOLIO.ink,
    "56px 40px",
    [
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", justify: "space-between", align: "center" },
        [
          body("Your name", { size: "15px", weight: "600", color: "#F4F2ED" }),
          body("Replace with a real copyright line and links.", { size: "13px", color: PORTFOLIO.inkMuted }),
        ],
      ),
    ],
    "1100px",
    "0",
  );
}

// `eyebrow` param kept (call sites still pass a section name) but no
// longer rendered as a small-caps label above the heading — impeccable
// craft-floor bans the kicker pattern outright; the heading carries its
// own weight instead.
function portfolioPageHero(_eyebrow: string, title: string, sub: string): Block {
  return bleed(
    PORTFOLIO.paper,
    "96px 40px 72px",
    [
      heading(title, { size: "56px", color: PORTFOLIO.text, align: "left", level: "h1", weight: "500", font: PORTFOLIO.font }),
      body(sub, { size: "18px", color: PORTFOLIO.textFaint, align: "left" }),
    ],
    "820px",
    "18px",
    { align: "flex-start", animation: "fade-in" },
  );
}

// Always dropped onto a dark PORTFOLIO.ink band in this template — light
// values, not PORTFOLIO.text/textFaint, or the numbers are unreadable
// against the dark background (same statCounter-on-dark-bleed gotcha
// docs/site-templates-plan.md's checklist calls out from the SaaS build).
function portfolioStatRow(stats: { value: string; suffix: string; label: string }[]): Block {
  return mk(
    "columns",
    { columns: String(stats.length) },
    { gap: "24px", animation: "fade-in" },
    stats.map((s) =>
      mk("statCounter", { value: s.value, prefix: "", suffix: s.suffix, label: s.label }, { valueColor: "#F4F2ED", valueFontSize: "38px", labelColor: PORTFOLIO.inkMuted, align: "center" }),
    ),
  );
}

function portfolioFaq(): Block {
  const items = [
    { q: "Replace with a real process question.", a: "Replace with the answer — keep it short and specific." },
    { q: "Replace with a real availability question.", a: "Replace with the answer." },
    { q: "Replace with a real pricing/engagement question.", a: "Replace with the answer." },
  ];
  return mk(
    "accordion",
    { items: items.map((i) => ({ id: randomUUID(), question: i.q, answer: i.a })), allowMultiple: "" },
    { titleColor: PORTFOLIO.text, contentColor: PORTFOLIO.textFaint, borderColor: PORTFOLIO.border, fontSize: "17px", animation: "fade-in" },
  );
}

// No background decoration on this genre's hero — a deliberate sixth
// choice, not an oversight. The other five genres each carry one
// structurally distinct device (SaaS: dot-grid, Agency: hard-edged wedge,
// Restaurant: organic wave, Hotel: line-art arch, Bar: neon squiggle);
// Portfolio's own distinguishing move is the 104px headline itself and
// the plain warm-paper field it sits on — undecorated restraint is the
// device here, matching Karolina Hess/Métier's minimal register.
export function portfolioHomeTemplate(): PageContent {
  const hero = bleed(
    PORTFOLIO.paper,
    "140px 40px 100px",
    [
      heading("Replace with a two-line headline that states what you make.", { size: "104px", color: PORTFOLIO.text, align: "left", level: "h1", weight: "400", font: PORTFOLIO.font, animation: "slide-up" }),
      body("Replace with a supporting sentence: who you work with and what changes once they hire you.", { size: "18px", color: PORTFOLIO.textFaint, align: "left" }),
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "12px", justify: "flex-start", animation: "fade-in" }, [
        cta("View work", { background: PORTFOLIO.accent, color: "#ffffff" }),
        cta("Get in touch", { background: "transparent", color: PORTFOLIO.text, variant: "secondary" }),
      ]),
      // A small status indicator, not a loud badge — fits the restrained
      // register (matches the "available for work" dot-plus-label pattern
      // real minimal portfolios lead with, e.g. a status line under the name).
      badge("● Available for new projects", { tone: "success" }),
    ],
    "980px",
    "26px",
    { align: "flex-start" },
  );

  const recentWork = bleed(
    PORTFOLIO.paper,
    "0px 40px 96px",
    [
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", justify: "space-between", align: "flex-end", animation: "fade-in" },
        [
          heading("Recent work", { size: "26px", color: PORTFOLIO.text, align: "left", weight: "500", font: PORTFOLIO.font }),
          body("Replace with a link label, e.g. \"View all\"", { size: "14px", color: PORTFOLIO.accent }),
        ],
      ),
      mk(
        "columns",
        { columns: "3" },
        { gap: "20px", animation: "slide-up" },
        [
          mk("imageOverlay", { src: "https://placehold.co/700x900", alt: "Replace with a description of this image", caption: "Replace with project name 1" }, { captionPosition: "bottom", overlayOpacity: "0.55", aspectRatio: "4 / 5", borderRadius: "4px" }),
          mk("imageOverlay", { src: "https://placehold.co/700x900", alt: "Replace with a description of this image", caption: "Replace with project name 2" }, { captionPosition: "bottom", overlayOpacity: "0.55", aspectRatio: "4 / 5", borderRadius: "4px" }),
          mk("imageOverlay", { src: "https://placehold.co/700x900", alt: "Replace with a description of this image", caption: "Replace with project name 3" }, { captionPosition: "bottom", overlayOpacity: "0.55", aspectRatio: "4 / 5", borderRadius: "4px" }),
        ],
      ),
    ],
    "1100px",
    "28px",
  );

  const statement = bleed(
    "#ffffff",
    "96px 40px",
    [
      heading("Replace with a statement paragraph about your approach — one or two confident sentences a client would remember.", { size: "34px", color: PORTFOLIO.text, align: "left", weight: "400", font: PORTFOLIO.font }),
    ],
    "820px",
    "0",
    { animation: "fade-in" },
  );

  const stats = bleed(PORTFOLIO.ink, "72px 40px", [portfolioStatRow([
    { value: "8", suffix: "+", label: "Replace with a real stat label" },
    { value: "40", suffix: "+", label: "Replace with a real stat label" },
    { value: "100", suffix: "%", label: "Replace with a real stat label" },
  ])], "1000px", "0");

  const finalCta = bleed(
    PORTFOLIO.accent,
    "80px 40px",
    [
      heading("Replace with a closing call to action", { size: "36px", color: "#ffffff", align: "center", weight: "400", font: PORTFOLIO.font }),
      body("Replace with a supporting sentence about starting a project.", { size: "16px", color: PORTFOLIO.accentSoft, align: "center" }),
      cta("Start a project", { background: "#ffffff", color: PORTFOLIO.accent }),
    ],
    "620px",
    "16px",
    { animation: "scale-in" },
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [
      portfolioNav("Home"),
      hero,
      recentWork,
      statement,
      stats,
      finalCta,
      portfolioFooter(),
    ]),
  };
}

type WorkItemSeed = { label: string; description: string };

export function portfolioWorkTemplate(): PageContent {
  const heroBlock = portfolioPageHero("Work", "Replace with a headline framing your body of work", "Replace with a sentence about the range of projects below.");

  const items: WorkItemSeed[] = [
    { label: "01 — Replace with project name 1", description: "Replace with a one-line project description (client type, discipline, year)." },
    { label: "02 — Replace with project name 2", description: "Replace with a one-line project description (client type, discipline, year)." },
    { label: "03 — Replace with project name 3", description: "Replace with a one-line project description (client type, discipline, year)." },
    { label: "04 — Replace with project name 4", description: "Replace with a one-line project description (client type, discipline, year)." },
  ];
  const workGrid = bleed(
    "#ffffff",
    "80px 40px 96px",
    [
      mk(
        "contentSwitcher",
        { items: items.map((i) => ({ id: randomUUID(), label: i.label, image: "https://placehold.co/900x1100", description: i.description })) },
        { activeColor: PORTFOLIO.text, inactiveColor: PORTFOLIO.textFaint, imageAspectRatio: "4 / 5", gap: "40px", animation: "fade-in" },
      ),
    ],
    "1100px",
    "0",
  );

  const finalCta = bleed(
    PORTFOLIO.accent,
    "72px 40px",
    [
      heading("Replace with a closing call to action", { size: "32px", color: "#ffffff", align: "center", weight: "400", font: PORTFOLIO.font }),
      cta("Start a project", { background: "#ffffff", color: PORTFOLIO.accent }),
    ],
    "600px",
    "20px",
    { animation: "scale-in" },
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [portfolioNav("Work"), heroBlock, workGrid, finalCta, portfolioFooter()]),
  };
}

export function portfolioAboutTemplate(): PageContent {
  const heroBlock = portfolioPageHero("About", "Replace with why you do this work", "Replace with two or three sentences about your background and approach.");

  const bioSection = bleed(
    "#ffffff",
    "0px 40px 96px",
    [
      mk(
        "columns",
        { columns: "2" },
        { gap: "56px", align: "center" },
        [
          mk("imageOverlay", { src: "https://placehold.co/800x1000", alt: "Replace with a description of this image", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 5", borderRadius: "4px", animation: "slide-right" }),
          mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "16px", animation: "slide-left" }, [
            body("Replace with a longer paragraph about your background — where you trained, what you've shipped, and what kind of work you're looking for next.", { size: "17px", color: PORTFOLIO.textFaint }),
            body("Replace with a second paragraph about how you work with clients — process, communication style, timelines.", { size: "17px", color: PORTFOLIO.textFaint }),
          ]),
        ],
      ),
    ],
    "1100px",
    "0",
  );

  const stats = bleed(PORTFOLIO.ink, "64px 40px", [portfolioStatRow([
    { value: "2018", suffix: "", label: "Working since" },
    { value: "40", suffix: "+", label: "Projects shipped" },
    { value: "12", suffix: "", label: "Countries worked with" },
  ])], "1000px", "0");

  const servicesSection = bleed(
    PORTFOLIO.paper,
    "88px 40px",
    [
      heading("What I do", { size: "30px", color: PORTFOLIO.text, align: "left", weight: "500", font: PORTFOLIO.font }),
      portfolioFaq(),
    ],
    "760px",
    "24px",
    { align: "flex-start", animation: "fade-in" },
  );

  const finalCta = bleed(
    PORTFOLIO.accent,
    "72px 40px",
    [
      heading("Replace with a closing call to action", { size: "30px", color: "#ffffff", align: "center", weight: "400", font: PORTFOLIO.font }),
      cta("Get in touch", { background: "#ffffff", color: PORTFOLIO.accent }),
    ],
    "600px",
    "20px",
    { animation: "scale-in" },
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [portfolioNav("About"), heroBlock, bioSection, stats, servicesSection, finalCta, portfolioFooter()]),
  };
}

export function portfolioContactTemplate(): PageContent {
  const heroBlock = portfolioPageHero("Contact", "Replace with a contact-page headline", "Replace with a sentence about response time or what to expect.");

  const formSection = bleed(
    "#ffffff",
    "0px 40px 96px",
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
          mk("section", { layout: "stack" }, { background: PORTFOLIO.paper, padding: "32px", borderRadius: "4px", gap: "16px" }, [
            heading("Replace with contact details", { size: "20px", color: PORTFOLIO.text, weight: "500", font: PORTFOLIO.font }),
            body("Replace with an email address.", { size: "15px", color: PORTFOLIO.textFaint }),
            body("Replace with a phone number (optional).", { size: "15px", color: PORTFOLIO.textFaint }),
            body("Replace with a location (optional).", { size: "15px", color: PORTFOLIO.textFaint }),
          ]),
        ],
      ),
    ],
    "1000px",
    "0",
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [portfolioNav("Contact"), heroBlock, formSection, portfolioFooter()]),
  };
}
