import type { Block, PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";

// docs/ui-ux-roadmap.md: "1–2 polished default header/footer
// templates so a new Site's site-wide chrome doesn't start empty either —
// same content model, just better authored starting content."
//
// Every color and spacing value here is a `$token` reference rather than a
// literal, so a site that started from a theme preset (lib/themePresets.ts)
// gets a header/footer already wearing that palette, and editing the theme
// later moves the chrome with it. Server-only (randomUUID), same split as
// lib/pageTemplates.ts.

const token = (path: string) => ({ $token: path });

function mk(type: string, props: Record<string, unknown>, style: Record<string, unknown>, children?: Block[]): Block {
  return { id: randomUUID(), type, props, style: { base: style }, children };
}

function navLink(label: string): Block {
  return mk("text", { content: label }, { fontSize: token("typography.sm"), fontWeight: "500", color: token("colors.text") });
}

export function defaultHeaderContent(): PageContent {
  return {
    version: 1,
    root: mk(
      "section",
      { layout: "row" },
      {
        background: token("colors.background"),
        padding: token("spacing.md"),
        justify: "space-between",
        align: "center",
      },
      [
        mk("text", { content: "Your site name" }, { fontSize: token("typography.lg"), fontWeight: "700", color: token("colors.text") }),
        mk(
          "section",
          { layout: "row" },
          { background: "transparent", padding: "0", gap: token("spacing.lg"), align: "center" },
          [navLink("Home"), navLink("About"), navLink("Contact")],
        ),
      ],
    ),
  };
}

export function defaultFooterContent(): PageContent {
  return {
    version: 1,
    root: mk(
      "section",
      { layout: "stack" },
      {
        background: token("colors.background"),
        padding: token("spacing.xl"),
        gap: token("spacing.md"),
        align: "center",
      },
      [
        mk(
          "section",
          { layout: "row" },
          { background: "transparent", padding: "0", gap: token("spacing.lg"), align: "center", justify: "center" },
          [navLink("Home"), navLink("About"), navLink("Contact"), navLink("Privacy")],
        ),
        mk(
          "text",
          { content: "Replace with a real copyright line." },
          { fontSize: token("typography.sm"), color: token("colors.secondary"), textAlign: "center" },
        ),
      ],
    ),
  };
}

/** Starter content for a newly created Template, or null for types that start blank. */
export function starterTemplateContent(type: string): PageContent | null {
  if (type === "header") return defaultHeaderContent();
  if (type === "footer") return defaultFooterContent();
  return null;
}
