import type { Block, PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";
import { mk, heading, body, cta, bleed } from "./_shared";

// SaaS / tech product genre — docs/site-templates-plan.md Phase A.
// Palette: near-black ink + one vivid indigo accent on a warm-white body —
// distinct from lib/pageTemplates.ts's amber/ink pairing so the two don't
// read as the same template recolored. Space Grotesk (already a curated
// FONT_STACKS entry) carries the confident, geometric SaaS voice.
//
// Every page repeats the same simple nav/footer band rather than relying
// on a Theme Builder header/footer Template — those are a separate,
// site-wide entity a user sets up once themselves (docs/theme-builder.md);
// a page template only ever produces `draftContent` for one Page, so
// baking in an identical nav/footer block on every page it creates is
// what actually reads as "one cohesive site" without a second content
// model. All copy is deliberately generic/placeholder — replace-me text,
// never a fabricated real testimonial or metric (same rule
// lib/pageTemplates.ts's own comment already states).
const SAAS = {
  ink: "#0B0B12",
  inkMuted: "#9CA3AF",
  paper: "#FAFAFA",
  text: "#111114",
  textFaint: "#6B7280",
  accent: "#6D5EF5",
  accentSoft: "#EEECFE",
  border: "#E5E7EB",
  font: "space-grotesk",
} as const;

function saasNav(active: string): Block {
  const links = ["Home", "Features", "Pricing", "About", "Contact"];
  return mk(
    "section",
    { layout: "row" },
    { background: SAAS.paper, padding: "20px 40px", justify: "space-between", align: "center", borderRadius: "0" },
    [
      body("Product name", { size: "16px", weight: "700", color: SAAS.text, font: SAAS.font }),
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", gap: "28px", align: "center" },
        links.map((l) => body(l, { size: "14px", weight: l === active ? "700" : "400", color: l === active ? SAAS.accent : SAAS.textFaint })),
      ),
    ],
  );
}

function saasFooter(): Block {
  return bleed(
    SAAS.ink,
    "56px 40px",
    [
      mk(
        "section",
        { layout: "row" },
        { background: "transparent", padding: "0", justify: "space-between", align: "center" },
        [
          body("Product name", { size: "15px", weight: "700", color: "#F4F4F5", font: SAAS.font }),
          body("Replace with a real copyright line and links.", { size: "13px", color: SAAS.inkMuted }),
        ],
      ),
    ],
    "1100px",
    "0",
  );
}

function saasPageHero(eyebrow: string, title: string, sub: string): Block {
  return bleed(
    SAAS.ink,
    "80px 40px 72px",
    [
      body(eyebrow, { size: "13px", weight: "700", color: SAAS.accent, align: "center" }),
      heading(title, { size: "44px", color: "#F4F4F5", align: "center", level: "h1", font: SAAS.font }),
      body(sub, { size: "17px", color: SAAS.inkMuted, align: "center" }),
    ],
    "680px",
    "16px",
  );
}

type AccordionSeed = { q: string; a: string };

function saasFaq(): Block {
  const items: AccordionSeed[] = [
    { q: "Replace with a real pricing question.", a: "Replace with the answer — keep it short and specific." },
    { q: "Replace with a real integration question.", a: "Replace with the answer." },
    { q: "Replace with a real security/compliance question.", a: "Replace with the answer." },
    { q: "Replace with a real cancellation question.", a: "Replace with the answer." },
  ];
  return mk(
    "accordion",
    { items: items.map((i) => ({ id: randomUUID(), question: i.q, answer: i.a })), allowMultiple: "" },
    { titleColor: SAAS.text, contentColor: SAAS.textFaint, borderColor: SAAS.border, fontSize: "17px", animation: "fade-in" },
  );
}

function saasLogoMarquee(): Block {
  const names = ["Company A", "Company B", "Company C", "Company D", "Company E", "Company F"];
  return mk(
    "marquee",
    { speed: "24", direction: "left", pauseOnHover: "true" },
    { gap: "56px" },
    names.map((n) => body(n, { size: "18px", weight: "600", color: SAAS.inkMuted })),
  );
}

// Always dropped onto a dark SAAS.ink band in this template (both
// callers below) — light values, not SAAS.text/textFaint, or the numbers
// are unreadable against the dark background. (Found live while
// verifying Phase A — see docs/site-templates-plan.md's checklist.)
function saasStatRow(stats: { value: string; suffix: string; label: string }[]): Block {
  return mk(
    "columns",
    { columns: String(stats.length) },
    { gap: "24px", animation: "fade-in" },
    stats.map((s) =>
      mk("statCounter", { value: s.value, prefix: "", suffix: s.suffix, label: s.label }, { valueColor: "#F4F4F5", valueFontSize: "40px", labelColor: SAAS.inkMuted, align: "center" }),
    ),
  );
}

export function saasHomeTemplate(): PageContent {
  // Gradient replaces the flat SAAS.ink field — a radial indigo bloom low
  // in the frame reads as depth/glow (the category's own "product glow"
  // visual language) rather than a flat corporate dark band. No eyebrow
  // label above the headline (impeccable craft-floor: the heading carries
  // its own weight).
  const hero = bleed(
    `radial-gradient(ellipse 120% 90% at 50% 120%, ${SAAS.accent}55, transparent 60%), linear-gradient(180deg, ${SAAS.ink} 0%, #050507 100%)`,
    "130px 40px 110px",
    [
      heading("Replace with your product's core value proposition.", { size: "56px", color: "#F4F4F5", align: "center", level: "h1", font: SAAS.font, animation: "slide-up" }),
      body("Replace with a supporting sentence that explains who this is for and what changes once they use it.", { size: "18px", color: SAAS.inkMuted, align: "center" }),
      mk("section", { layout: "row" }, { background: "transparent", padding: "0", gap: "12px", justify: "center", animation: "fade-in" }, [
        cta("Start free trial", { background: SAAS.accent, color: "#ffffff" }),
        cta("View pricing", { background: "transparent", color: "#F4F4F5", variant: "secondary" }),
      ]),
    ],
    "740px",
    "22px",
  );

  const logos = bleed(SAAS.paper, "40px 40px", [body("Trusted by teams at", { size: "12px", weight: "700", color: SAAS.textFaint, align: "center" }), saasLogoMarquee()], "1100px", "20px");

  const featureCard = (title: string, copy: string): Block =>
    mk(
      "section",
      { layout: "stack" },
      { background: "#ffffff", padding: "32px", borderRadius: "16px", gap: "12px", align: "flex-start", borderColor: SAAS.border, animation: "slide-up" },
      [heading(title, { size: "19px", color: SAAS.text, font: SAAS.font }), body(copy, { size: "15px", color: SAAS.textFaint })],
    );

  const features = bleed(
    SAAS.paper,
    "96px 40px",
    [
      heading("Replace with your three strongest feature headlines", { size: "34px", color: SAAS.text, align: "center", font: SAAS.font }),
      body("Replace with one sentence about what's different here.", { size: "16px", color: SAAS.textFaint, align: "center" }),
      mk("section", { layout: "stack" }, { background: "transparent", padding: "0", maxWidth: "1100px", gap: "0" }, [
        mk("columns", { columns: "3" }, { gap: "24px" }, [
          featureCard("Replace with feature one", "Replace with a short benefit description."),
          featureCard("Replace with feature two", "Replace with a short benefit description."),
          featureCard("Replace with feature three", "Replace with a short benefit description."),
        ]),
      ]),
    ],
    "760px",
    "16px",
  );

  const stats = bleed(SAAS.ink, "72px 40px", [saasStatRow([
    { value: "10000", suffix: "+", label: "Replace with a real stat label" },
    { value: "99", suffix: "%", label: "Replace with a real stat label" },
    { value: "40", suffix: "+", label: "Replace with a real stat label" },
  ])], "1000px", "0");

  const pricingTeaser = bleed(
    "#ffffff",
    "96px 40px",
    [
      heading("Simple pricing", { size: "34px", color: SAAS.text, align: "center", font: SAAS.font }),
      body("Replace with a one-line pricing philosophy. See the full pricing page for tier details.", { size: "16px", color: SAAS.textFaint, align: "center" }),
      cta("See full pricing", { background: SAAS.accent, color: "#ffffff" }),
    ],
    "640px",
    "16px",
  );

  const faq = bleed(SAAS.paper, "96px 40px", [heading("Frequently asked questions", { size: "32px", color: SAAS.text, align: "center", font: SAAS.font }), saasFaq()], "760px", "24px");

  const finalCta = bleed(
    `linear-gradient(135deg, ${SAAS.accent} 0%, #4C3FCF 100%)`,
    "72px 40px",
    [
      heading("Replace with a closing call to action", { size: "32px", color: "#ffffff", align: "center", font: SAAS.font }),
      body("Replace with a supporting sentence.", { size: "16px", color: SAAS.accentSoft, align: "center" }),
      cta("Start free trial", { background: "#ffffff", color: SAAS.accent }),
    ],
    "620px",
    "16px",
    { animation: "scale-in" },
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [
      saasNav("Home"),
      hero,
      logos,
      features,
      stats,
      pricingTeaser,
      faq,
      finalCta,
      saasFooter(),
    ]),
  };
}

export function saasFeaturesTemplate(): PageContent {
  const heroBlock = saasPageHero("Features", "Replace with a features-page headline", "Replace with a sentence framing the feature set below.");

  const featureRow = (eyebrow: string, title: string, copy: string, reverse: boolean): Block =>
    mk(
      "columns",
      { columns: "2" },
      { gap: "48px", align: "center" },
      reverse
        ? [
            mk("imageOverlay", { src: "https://placehold.co/700x500", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 3", borderRadius: "16px", animation: "slide-right" }),
            mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "12px", animation: "slide-left" }, [
              body(eyebrow, { size: "12px", weight: "700", color: SAAS.accent }),
              heading(title, { size: "26px", color: SAAS.text, font: SAAS.font }),
              body(copy, { size: "16px", color: SAAS.textFaint }),
            ]),
          ]
        : [
            mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "12px", animation: "slide-right" }, [
              body(eyebrow, { size: "12px", weight: "700", color: SAAS.accent }),
              heading(title, { size: "26px", color: SAAS.text, font: SAAS.font }),
              body(copy, { size: "16px", color: SAAS.textFaint }),
            ]),
            mk("imageOverlay", { src: "https://placehold.co/700x500", alt: "", caption: "" }, { captionPosition: "bottom", overlayOpacity: "0", aspectRatio: "4 / 3", borderRadius: "16px", animation: "slide-left" }),
          ],
    );

  const rows = bleed(
    "#ffffff",
    "88px 40px",
    [
      featureRow("Replace with a label", "Replace with feature headline one", "Replace with a paragraph describing this feature in more depth than the home page allows.", false),
      featureRow("Replace with a label", "Replace with feature headline two", "Replace with a paragraph describing this feature in more depth than the home page allows.", true),
      featureRow("Replace with a label", "Replace with feature headline three", "Replace with a paragraph describing this feature in more depth than the home page allows.", false),
    ],
    "1100px",
    "72px",
  );

  const comparisonSection = bleed(
    SAAS.paper,
    "88px 40px",
    [
      heading("How it compares", { size: "32px", color: SAAS.text, align: "center", font: SAAS.font }),
      mk(
        "comparisonTable",
        {
          columns: [
            { id: randomUUID(), title: "Doing it manually", highlighted: false },
            { id: randomUUID(), title: "Product name", highlighted: true },
          ],
          rows: [
            { id: randomUUID(), label: "Replace with a comparison row", cells: ["no", "yes"] },
            { id: randomUUID(), label: "Replace with a comparison row", cells: ["no", "yes"] },
            { id: randomUUID(), label: "Replace with a comparison row", cells: ["Limited", "yes"] },
          ],
        },
        { accentColor: SAAS.accent, headerColor: SAAS.text, labelColor: SAAS.textFaint, animation: "fade-in" },
      ),
    ],
    "800px",
    "32px",
  );

  const finalCta = bleed(SAAS.accent, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: "#ffffff", align: "center", font: SAAS.font }), cta("Start free trial", { background: "#ffffff", color: SAAS.accent })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [saasNav("Features"), heroBlock, rows, comparisonSection, finalCta, saasFooter()]),
  };
}

type PricingTierSeed = { name: string; price: string; period: string; features: string; ctaLabel: string; highlighted: boolean };

export function saasPricingTemplate(): PageContent {
  const heroBlock = saasPageHero("Pricing", "Replace with a pricing-page headline", "Replace with a sentence about your pricing philosophy — transparent, usage-based, whatever's true.");

  const tiers: PricingTierSeed[] = [
    { name: "Starter", price: "$0", period: "/mo", features: "Replace with feature\nReplace with feature\nReplace with feature", ctaLabel: "Get started", highlighted: false },
    { name: "Pro", price: "$29", period: "/mo", features: "Replace with feature\nReplace with feature\nReplace with feature\nReplace with feature", ctaLabel: "Start free trial", highlighted: true },
    { name: "Enterprise", price: "Talk to us", period: "", features: "Replace with feature\nReplace with feature\nReplace with feature", ctaLabel: "Contact sales", highlighted: false },
  ];
  const pricingBlock = bleed(
    "#ffffff",
    "88px 40px",
    [
      mk(
        "pricingTable",
        { tiers: tiers.map((t) => ({ id: randomUUID(), name: t.name, price: t.price, period: t.period, features: t.features, ctaLabel: t.ctaLabel, ctaHref: "#", highlighted: t.highlighted })) },
        { accentColor: SAAS.accent, gap: "24px", animation: "slide-up" },
      ),
    ],
    "1000px",
    "0",
  );

  const faq = bleed(SAAS.paper, "88px 40px", [heading("Billing questions", { size: "30px", color: SAAS.text, align: "center", font: SAAS.font }), saasFaq()], "760px", "24px");

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [saasNav("Pricing"), heroBlock, pricingBlock, faq, saasFooter()]),
  };
}

type TeamSeed = { name: string; role: string };

export function saasAboutTemplate(): PageContent {
  const heroBlock = saasPageHero("About", "Replace with why this company exists", "Replace with two or three sentences about the mission — enough to build trust, not a full history.");

  const mission = bleed(
    "#ffffff",
    "80px 40px",
    [
      heading("Replace with your mission statement", { size: "28px", color: SAAS.text, align: "center", font: SAAS.font }),
      body("Replace with a longer paragraph about how the company approaches the problem it's solving.", { size: "17px", color: SAAS.textFaint, align: "center" }),
    ],
    "700px",
    "16px",
  );

  const stats = bleed(SAAS.ink, "64px 40px", [saasStatRow([
    { value: "2019", suffix: "", label: "Founded" },
    { value: "40", suffix: "+", label: "Team members" },
    { value: "12", suffix: "", label: "Countries" },
  ])], "1000px", "0");

  const team: TeamSeed[] = [
    { name: "Replace with name 1", role: "Replace with a role" },
    { name: "Replace with name 2", role: "Replace with a role" },
    { name: "Replace with name 3", role: "Replace with a role" },
  ];
  const teamSection = bleed(
    SAAS.paper,
    "88px 40px",
    [
      heading("Team", { size: "30px", color: SAAS.text, align: "center", font: SAAS.font }),
      mk(
        "contentSwitcher",
        { items: team.map((t) => ({ id: randomUUID(), label: t.name, image: "https://placehold.co/600x750", description: t.role })) },
        { activeColor: SAAS.text, inactiveColor: SAAS.inkMuted, imageAspectRatio: "4 / 5", animation: "fade-in" },
      ),
    ],
    "900px",
    "32px",
  );

  const finalCta = bleed(SAAS.accent, "72px 40px", [heading("Replace with a closing call to action", { size: "30px", color: "#ffffff", align: "center", font: SAAS.font }), cta("Get in touch", { background: "#ffffff", color: SAAS.accent })], "600px", "20px", { animation: "scale-in" });

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [saasNav("About"), heroBlock, mission, stats, teamSection, finalCta, saasFooter()]),
  };
}

export function saasContactTemplate(): PageContent {
  const heroBlock = saasPageHero("Contact", "Replace with a contact-page headline", "Replace with a sentence about response time or what to expect.");

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
                { id: randomUUID(), type: "textarea", label: "Message", required: true },
              ],
              submitLabel: "Send message",
              onSubmit: { action: "storeOnly" },
            },
            { padding: "0" },
          ),
          mk("section", { layout: "stack" }, { background: SAAS.paper, padding: "32px", borderRadius: "16px", gap: "16px" }, [
            heading("Replace with contact details", { size: "20px", color: SAAS.text, font: SAAS.font }),
            body("Replace with an email address.", { size: "15px", color: SAAS.textFaint }),
            body("Replace with a phone number (optional).", { size: "15px", color: SAAS.textFaint }),
            body("Replace with an office address (optional).", { size: "15px", color: SAAS.textFaint }),
          ]),
        ],
      ),
    ],
    "1000px",
    "0",
  );

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [saasNav("Contact"), heroBlock, formSection, saasFooter()]),
  };
}
