import type { Block } from "@/components/blocks/types";

// Global Web Crypto `crypto.randomUUID()` (same as components/blocks/
// registry.tsx's createBlock), not Node's `crypto` module — this file is
// imported into a "use client" component (SectionPicker.tsx) and runs in
// the browser when a preset is inserted, unlike lib/pageTemplates.ts's
// `import { randomUUID } from "crypto"`, which only ever runs server-side
// (page-creation API route).
function randomUUID(): string {
  return crypto.randomUUID();
}

// A curated library of finished, ready-to-drop-in sections — inserted via
// the same "detached copy" mechanism as a user's own saved blocks
// (components/editor/EditorClient.tsx's handleInsertSavedBlock), just
// system-provided instead of user-created. The goal: a user should need
// to edit as little as possible — swap a headline, maybe an image — not
// assemble a section from scratch.
//
// Organized as STYLE KITS × SHAPES, not one-off presets: every section a
// user inserts should belong to a coherent visual system (one palette,
// one font pairing) so mixing sections on the same page never produces a
// mismatched patchwork. Each kit below carries the *complete* set of
// shapes (hero, feature grid, quote, CTA, FAQ, process steps, about
// split, newsletter) — pick a kit once, then every section from it
// matches. Variety lives *across* kits (a different palette/font/voice
// per kit), never *within* one.
//
// Uses the `hero` block (components/blocks/registry.tsx) as the wrapper
// for any shape that wants an edge-to-edge coloured band — it's a real
// full-bleed container (docs/ui-ux-roadmap.md), not fixed to a specific
// hero layout, so it doubles as a generic "full-bleed section" primitive
// for a process strip, a quote, a CTA banner, etc. Shapes that should
// stay within the page's normal padded flow use a plain `section`.

function mk(type: string, props: Record<string, unknown>, style: Record<string, unknown>, children?: Block[]): Block {
  return { id: randomUUID(), type, props, style: { base: style }, children };
}

function heading(text: string, opts: { size: string; color: string; align?: string; level?: string; weight?: string; font?: string }): Block {
  return mk(
    "heading",
    { text, level: opts.level ?? "h2" },
    {
      fontSize: opts.size,
      fontWeight: opts.weight ?? "700",
      color: opts.color,
      textAlign: opts.align ?? "left",
      ...(opts.font ? { fontFamily: opts.font } : {}),
    },
  );
}

function body(text: string, opts: { size?: string; color: string; align?: string; weight?: string; font?: string }): Block {
  return mk(
    "text",
    { content: text },
    {
      fontSize: opts.size ?? "17px",
      fontWeight: opts.weight ?? "400",
      color: opts.color,
      textAlign: opts.align ?? "left",
      ...(opts.font ? { fontFamily: opts.font } : {}),
    },
  );
}

function button(label: string, opts: { background: string; color: string; variant?: string }): Block {
  return mk(
    "button",
    { label, href: "#", variant: opts.variant ?? "primary" },
    { padding: "15px 30px", borderRadius: "8px", fontSize: "16px", fontWeight: "600", background: opts.background, color: opts.color },
  );
}

function image(src: string, alt = ""): Block {
  return mk("image", { src, alt }, { borderRadius: "16px" });
}

/** The full-bleed hero-as-generic-band wrapper every colour-band shape below uses. */
function band(
  background: string,
  padding: string,
  content: Block[],
  opts: { contentWidth?: string; align?: string; gap?: string } = {},
): Block {
  return mk(
    "hero",
    { backgroundImage: "" },
    { background, padding, contentWidth: opts.contentWidth ?? "700px", align: opts.align ?? "center", gap: opts.gap ?? "20px" },
    content,
  );
}

// ---------------------------------------------------------------------
// Style kits — one palette + one font pairing each. `dark`/`onDark` back
// any full-bleed band that wants strong contrast (hero, CTA, process
// strip, newsletter); `paper`/`ink` back lighter sections (feature grid,
// FAQ, quote, about). One `accent`, used sparingly (a label, a button, an
// attribution line) — never as a large fill, per standard colour-
// restraint practice for avoiding a generic "AI blue button" look.
type StyleKit = {
  id: string;
  name: string;
  description: string;
  font: string;
  dark: string;
  onDark: string;
  onDarkMuted: string;
  paper: string;
  ink: string;
  inkMuted: string;
  card: string;
  accent: string;
  accentOn: string;
  placeholder: (w: number, h: number, seed: string) => string;
};

function placeholderUrl(w: number, h: number, bg: string, fg: string): (seed: string) => string {
  return () => `https://placehold.co/${w}x${h}/${bg.replace("#", "")}/${fg.replace("#", "")}`;
}

const EDITORIAL: StyleKit = {
  id: "editorial",
  name: "Editorial",
  description: "Dark ink, cream paper, a serif display face.",
  font: "fraunces",
  dark: "#1A1512",
  onDark: "#F7F1E6",
  onDarkMuted: "#C9BFAF",
  paper: "#F7F1E6",
  ink: "#241F19",
  inkMuted: "#6B5B4A",
  card: "#FFFCF7",
  accent: "#C1440E",
  accentOn: "#F7F1E6",
  placeholder: (w, h) => placeholderUrl(w, h, "1A1512", "C9BFAF")(""),
};

const MODERN_MINIMAL: StyleKit = {
  id: "modern-minimal",
  name: "Modern Minimal",
  description: "Cool paper, near-navy ink, a geometric sans.",
  font: "space-grotesk",
  dark: "#12161F",
  onDark: "#F5F7FA",
  onDarkMuted: "#9AA6B8",
  paper: "#F5F7FA",
  ink: "#12161F",
  inkMuted: "#4B5565",
  card: "#FFFFFF",
  accent: "#2C5CE0",
  accentOn: "#FFFFFF",
  placeholder: (w, h) => placeholderUrl(w, h, "E2E8F0", "64748B")(""),
};

const WARM_PLAYFUL: StyleKit = {
  id: "warm-playful",
  name: "Warm Playful",
  description: "Warm cream, coral accent, a rounded humanist sans.",
  font: "jakarta-sans",
  dark: "#2B2016",
  onDark: "#FBF1E6",
  onDarkMuted: "#D8C4AE",
  paper: "#FBF1E6",
  ink: "#2B2320",
  inkMuted: "#6B5B4A",
  card: "#FFFFFF",
  accent: "#E0662E",
  accentOn: "#2B2016",
  placeholder: (w, h) => placeholderUrl(w, h, "F3D9C4", "8A5A3B")(""),
};

export const STYLE_KITS: StyleKit[] = [EDITORIAL, MODERN_MINIMAL, WARM_PLAYFUL];

// ---------------------------------------------------------------------
// Shapes — each takes a kit and returns one finished section. Every shape
// is offered for every kit (the cross product below), so the count of
// shapes here times STYLE_KITS.length is the total preset count.

function heroStatement(kit: StyleKit): Block {
  return band(kit.dark, "120px 24px", [
    body("STATEMENT", { size: "13px", color: kit.accent, align: "center", weight: "700" }),
    heading("Say the one thing that matters.", { size: "clamp(36px, 6vw, 64px)", color: kit.onDark, align: "center", level: "h1", font: kit.font }),
    body("Replace this line with the single sentence a visitor needs to understand what you do.", { size: "18px", color: kit.onDarkMuted, align: "center" }),
    button("Get started", { background: kit.accent, color: kit.accentOn }),
  ], { contentWidth: "680px" });
}

function heroSplit(kit: StyleKit): Block {
  const left = mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "18px", align: "flex-start" }, [
    heading("Built for teams who ship weekly, not yearly.", { size: "clamp(30px, 4vw, 44px)", color: kit.ink, align: "left", level: "h1", font: kit.font }),
    body("A short paragraph explaining the product or offer — two sentences is plenty.", { size: "17px", color: kit.inkMuted, align: "left" }),
    button("See how it works", { background: kit.accent, color: kit.accentOn }),
  ]);
  const right = image(kit.placeholder(640, 480, "hero"), "");
  return band(kit.paper, "96px 24px", [mk("columns", { columns: "2" }, { gap: "48px" }, [left, right])], { contentWidth: "1100px", align: "stretch", gap: "0" });
}

function processStrip(kit: StyleKit): Block {
  const step = (n: string, title: string, copy: string) =>
    mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "10px", align: "flex-start" }, [
      body(n, { size: "14px", color: kit.accent, weight: "600" }),
      heading(title, { size: "20px", color: kit.onDark, level: "h3", font: kit.font }),
      body(copy, { size: "15px", color: kit.onDarkMuted }),
    ]);
  return band(kit.dark, "88px 24px", [
    mk("columns", { columns: "3" }, { gap: "32px" }, [
      step("01", "Start", "Replace with the first step of your process."),
      step("02", "Build", "Replace with the second step."),
      step("03", "Ship", "Replace with the third and final step."),
    ]),
  ], { contentWidth: "1000px", align: "stretch" });
}

function featureGrid(kit: StyleKit): Block {
  const feature = (title: string, copy: string) =>
    mk("section", { layout: "stack" }, { background: kit.card, padding: "28px", borderRadius: "14px", gap: "10px", align: "flex-start" }, [
      heading(title, { size: "19px", color: kit.ink, level: "h3", font: kit.font }),
      body(copy, { size: "15px", color: kit.inkMuted }),
    ]);
  return band(kit.paper, "96px 24px", [
    body("WHAT'S INCLUDED", { size: "13px", color: kit.accent, align: "center", weight: "700" }),
    heading("Everything included, nothing extra.", { size: "34px", color: kit.ink, align: "center", font: kit.font }),
    body("A short line introducing the three things below.", { size: "16px", color: kit.inkMuted, align: "center" }),
    mk("columns", { columns: "3" }, { gap: "20px" }, [
      feature("First thing", "Replace with a short benefit description."),
      feature("Second thing", "Replace with a short benefit description."),
      feature("Third thing", "Replace with a short benefit description."),
    ]),
  ], { contentWidth: "1080px", gap: "40px" });
}

function bigQuote(kit: StyleKit): Block {
  return band(kit.paper, "104px 24px", [
    heading("“Replace this with the strongest sentence someone has said about you.”", { size: "clamp(26px, 3.4vw, 38px)", color: kit.ink, align: "center", level: "h2", font: kit.font, weight: "500" }),
    body("NAME SURNAME · ROLE, COMPANY", { size: "13px", color: kit.accent, align: "center", weight: "700" }),
  ], { contentWidth: "760px", gap: "24px" });
}

function ctaBanner(kit: StyleKit): Block {
  return band(kit.dark, "80px 24px", [
    heading("Ready when you are.", { size: "clamp(28px, 4vw, 42px)", color: kit.onDark, align: "center", level: "h2", font: kit.font }),
    button("Get started — it's free", { background: kit.accent, color: kit.accentOn }),
  ], { contentWidth: "620px", gap: "28px" });
}

function faqSection(kit: StyleKit): Block {
  const qa = (q: string, a: string) =>
    mk("section", { layout: "stack" }, { background: "transparent", padding: "20px 0 0", gap: "8px", align: "flex-start" }, [
      heading(q, { size: "18px", color: kit.accent, level: "h3", font: kit.font }),
      body(a, { size: "15px", color: kit.inkMuted }),
    ]);
  return mk("section", { layout: "stack" }, { background: kit.paper, padding: "88px 24px", align: "center", gap: "8px" }, [
    mk("section", { layout: "stack" }, { background: "transparent", padding: "0", maxWidth: "680px", align: "stretch", gap: "4px" }, [
      heading("Frequently asked questions", { size: "30px", color: kit.ink, align: "center", font: kit.font }),
      qa("Replace with a real question?", "Replace with the answer."),
      qa("Another common question?", "Replace with the answer."),
      qa("A third question?", "Replace with the answer."),
    ]),
  ]);
}

function aboutSplit(kit: StyleKit): Block {
  const img = image(kit.placeholder(560, 560, "about"), "");
  const copy = mk("section", { layout: "stack" }, { background: "transparent", padding: "0", gap: "16px", align: "flex-start" }, [
    body("ABOUT", { size: "13px", color: kit.accent, weight: "700" }),
    heading("A short story about who's behind this.", { size: "32px", color: kit.ink, level: "h2", font: kit.font, weight: kit.font === "fraunces" ? "500" : "700" }),
    body("Replace with two or three sentences about the people or the mission — enough to build trust, not a full biography.", { size: "16px", color: kit.inkMuted }),
  ]);
  return band(kit.paper, "96px 24px", [mk("columns", { columns: "2" }, { gap: "48px" }, [img, copy])], { contentWidth: "1000px", align: "stretch" });
}

function newsletterCta(kit: StyleKit): Block {
  const newsletter = mk(
    "newsletter",
    { placeholder: "you@example.com", submitLabel: "Subscribe", successMessage: "Thanks — you're subscribed." },
    { padding: "0", background: "transparent" },
  );
  return band(kit.dark, "88px 24px", [
    heading("Get updates, not noise.", { size: "30px", color: kit.onDark, align: "center", level: "h2", font: kit.font }),
    body("One short line about what subscribers get and how often.", { size: "16px", color: kit.onDarkMuted, align: "center" }),
    newsletter,
  ], { contentWidth: "480px", gap: "20px" });
}

const SHAPES: { id: string; label: string; description: string; build: (kit: StyleKit) => Block }[] = [
  { id: "hero-statement", label: "Bold Statement Hero", description: "One confident sentence, full-bleed band.", build: heroStatement },
  { id: "hero-split", label: "Split Intro Hero", description: "Copy + image side by side.", build: heroSplit },
  { id: "process-strip", label: "Numbered Process Strip", description: "Three steps in a dark band.", build: processStrip },
  { id: "feature-grid", label: "Feature Grid", description: "Three cards introducing what's included.", build: featureGrid },
  { id: "big-quote", label: "Big Statement Quote", description: "One large quote, centered.", build: bigQuote },
  { id: "cta-banner", label: "CTA Banner", description: "One clear call to action.", build: ctaBanner },
  { id: "faq-section", label: "FAQ Section", description: "Three stacked question/answer pairs.", build: faqSection },
  { id: "about-split", label: "About / Team Split", description: "Heading + copy beside an image.", build: aboutSplit },
  { id: "newsletter-cta", label: "Newsletter Signup", description: "A working signup form.", build: newsletterCta },
];

export type SectionPreset = {
  id: string;
  label: string;
  description: string;
  kitId: string;
  kitName: string;
  build: () => Block;
};

// The full cross product: every shape, in every kit — so picking a kit
// once and using only its section always produces a page where every
// section matches (docs/ui-ux-roadmap.md: "styles of the inserted block
// should always fit the currently used blocks, not all different
// styles").
export const SECTION_PRESETS: SectionPreset[] = STYLE_KITS.flatMap((kit) =>
  SHAPES.map((shape) => ({
    id: `${shape.id}--${kit.id}`,
    label: shape.label,
    description: shape.description,
    kitId: kit.id,
    kitName: kit.name,
    build: () => shape.build(kit),
  })),
);
