import type { Block, PageContent } from "@/components/blocks/types";
import { emptyPageContent } from "@/lib/pageContent";
import { randomUUID } from "crypto";
export { PAGE_TEMPLATES, type PageTemplateOption } from "@/lib/pageTemplateOptions";

// docs/ui-ux-roadmap.md Phase B: a small, deliberately-curated set of
// starting points for a new Page, offered alongside "blank" in the
// create-page flow (components/dashboard/PageList.tsx). Each template is a
// real, finished-looking block tree built entirely from existing block
// types/styles (BlockRenderer.tsx never forks for these — a template is
// just a `draftContent` value, same as any hand-authored page) plus the
// small additive style props this same pass added to registry.tsx
// (section align/justify/gap/maxWidth/borderRadius, text/heading textAlign,
// button/image borderRadius).
//
// Direction (kept here rather than only in a commit message, since a
// future contributor extending this file should carry it forward
// consistently): a confident, editorial "product launch" world — deep ink
// sections (#0B1120) punctuated by one saturated amber accent (#F59E0B) on
// white body sections, bold oversized headings, generous vertical rhythm.
// Deliberately not the cream-background/serif-display look that's the
// default rendition for most AI-assisted design — see impeccable's
// new-work.md calibration notes. No photography: the block system has no
// seeded asset library, so color/typography/spacing carry the whole
// expressive load.
const INK = "#0B1120";
const INK_MUTED = "#94A3B8";
const INK_FAINT = "#64748B";
const PAPER = "#F8FAFC";
const AMBER = "#F59E0B";

function mk(type: string, props: Record<string, unknown>, style: Record<string, unknown>, children?: Block[]): Block {
  return {
    id: randomUUID(),
    type,
    props,
    style: { base: style },
    children,
  };
}

function heading(text: string, opts: { size: string; color?: string; align?: string; level?: string } = { size: "32px" }): Block {
  return mk(
    "heading",
    { text, level: opts.level ?? "h2" },
    { fontSize: opts.size, fontWeight: "700", color: opts.color ?? INK, textAlign: opts.align ?? "left" },
  );
}

function body(text: string, opts: { size?: string; color?: string; align?: string; weight?: string } = {}): Block {
  return mk(
    "text",
    { content: text },
    {
      fontSize: opts.size ?? "17px",
      fontWeight: opts.weight ?? "400",
      color: opts.color ?? INK_FAINT,
      textAlign: opts.align ?? "left",
    },
  );
}

function cta(label: string, opts: { background: string; color: string }): Block {
  return mk(
    "button",
    { label, href: "#", variant: "primary" },
    { padding: "16px 32px", borderRadius: "8px", fontSize: "17px", fontWeight: "600", background: opts.background, color: opts.color },
  );
}

/** A full-bleed background section wrapping a centered, width-capped content column — the recurring pattern this template uses for every section. */
function bleed(background: string, padding: string, content: Block[], contentWidth = "760px", gap = "24px"): Block {
  return mk(
    "section",
    { layout: "stack" },
    { background, padding, align: "center", gap: "0" },
    [mk("section", { layout: "stack" }, { background: "transparent", padding: "0", maxWidth: contentWidth, align: "center", gap }, content)],
  );
}

export function landingPageTemplateContent(): PageContent {
  const hero = bleed(
    INK,
    "128px 24px 112px",
    [
      body("OPEN SOURCE · SELF-HOSTED", { size: "13px", color: AMBER, align: "center", weight: "700" }),
      heading("Build and publish real pages, without touching code.", { size: "56px", color: "#F8FAFC", align: "center", level: "h1" }),
      body("Create a site, edit it live in a visual block editor, and publish instantly — running entirely on infrastructure you own.", {
        size: "19px",
        color: INK_MUTED,
        align: "center",
      }),
      cta("Get started", { background: AMBER, color: INK }),
    ],
    "700px",
    "28px",
  );

  const featureCard = (title: string, copy: string): Block =>
    mk(
      "section",
      { layout: "stack" },
      { background: PAPER, padding: "32px", borderRadius: "16px", gap: "12px", align: "flex-start" },
      [heading(title, { size: "20px", color: INK }), body(copy, { size: "15px", color: INK_FAINT })],
    );

  const features = mk(
    "section",
    { layout: "stack" },
    { background: "#ffffff", padding: "96px 24px", align: "center", gap: "56px" },
    [
      mk("section", { layout: "stack" }, { background: "transparent", padding: "0", maxWidth: "640px", align: "center", gap: "16px" }, [
        heading("Everything you need to ship a real site", { size: "36px", align: "center" }),
        body("No build step, no vendor lock-in — just a block editor, a Postgres database, and your own server.", {
          size: "17px",
          align: "center",
        }),
      ]),
      mk(
        "section",
        { layout: "stack" },
        { background: "transparent", padding: "0", maxWidth: "1100px", gap: "0" },
        [
          mk("columns", { columns: "3" }, { gap: "24px" }, [
            featureCard("Live visual editing", "What you see in the editor canvas is exactly what publishes — one shared render path, no preview drift."),
            featureCard("Self-hosted, always", "Docker Compose or bare Node. Your data stays in your own Postgres, not a vendor's cloud."),
            featureCard("Built to extend", "A plugin SDK, a public API, a CLI, and an MCP server — script it or hand it to an agent."),
          ]),
        ],
      ),
    ],
  );

  const proof = bleed(
    INK,
    "96px 24px",
    [
      heading("“The editor canvas and the live site are the same code path — what you see is what ships.”", {
        size: "26px",
        color: "#F8FAFC",
        align: "center",
        level: "h2",
      }),
      body("— OpenSite Studio's own architecture principle, not a customer quote (this is a starter template; replace with a real one).", {
        size: "14px",
        color: INK_FAINT,
        align: "center",
      }),
    ],
    "760px",
    "20px",
  );

  const finalCta = bleed(
    AMBER,
    "80px 24px",
    [
      heading("Ready to launch your first site?", { size: "34px", color: INK, align: "center" }),
      body("Sign up, create a Site, and publish your first page in the next five minutes.", { size: "17px", color: INK, align: "center" }),
      cta("Create your site", { background: INK, color: AMBER }),
    ],
    "620px",
    "20px",
  );

  const footer = bleed(INK, "40px 24px", [body("Powered by OpenSite Studio — self-hosted and open source.", { size: "13px", color: INK_FAINT, align: "center" })], "760px", "0");

  return {
    version: 1,
    root: mk("section", { layout: "stack" }, { padding: "0", background: "#ffffff", gap: "0" }, [hero, features, proof, finalCta, footer]),
  };
}

export function pageContentForTemplate(templateId: string): PageContent {
  if (templateId === "landing") return landingPageTemplateContent();
  return emptyPageContent();
}
