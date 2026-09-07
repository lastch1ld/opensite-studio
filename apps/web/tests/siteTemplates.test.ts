import { describe, expect, it } from "vitest";
import { SITE_TEMPLATES } from "@/lib/siteTemplateOptions";
import { siteTemplatePageContent } from "@/lib/siteTemplates";
import { registeredBlockTypes } from "./support/registry";
import { missingImages, walk } from "./support/blockAudit";
import { auditPageContent } from "@/lib/a11y";
import { DEFAULT_THEME_TOKENS } from "@/lib/theme";

// The templates have never been opened in a running app — no Postgres
// here — so these assertions are the half of docs/site-templates-plan.md's
// quality bar that a block tree can be checked against without a browser:
// registered types, unique ids, real images, distinct switcher labels,
// animation on every content section, and a clean pass of the product's
// own accessibility audit.

const cases = SITE_TEMPLATES.flatMap((t) => t.pages.map((p) => ({ templateId: t.id, slug: p.slug })));
const known = new Set(registeredBlockTypes());

describe.each(cases)("$templateId/$slug", ({ templateId, slug }) => {
  const content = siteTemplatePageContent(templateId, slug);

  it("is dispatched by siteTemplatePageContent", () => {
    // The catalog (siteTemplateOptions) and the dispatcher (siteTemplates)
    // are two hand-maintained lists of the same slugs — a page advertised
    // in the picker but missing from the dispatcher creates an empty page.
    expect(content, `${templateId}/${slug} is in SITE_TEMPLATES but the dispatcher returns null`).not.toBeNull();
  });

  const visits = content ? walk(content, slug) : [];

  it("uses only registered block types", () => {
    const unknown = visits.filter((v) => !known.has(v.block.type)).map((v) => v.path);
    expect(unknown).toEqual([]);
  });

  it("gives every block a unique id", () => {
    const ids = visits.map((v) => v.block.id);
    expect(ids.filter((id) => !id)).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("clears the accessibility audit the product runs on its users' pages", () => {
    // Same checker as the accessibility panel (lib/a11y.ts) — a template
    // that ships with the product must not fail the audit the product
    // performs on everyone else's pages. Errors only: the one warning the
    // templates keep is `link-target`, since a placeholder link that goes
    // nowhere yet is what a template is supposed to hand over.
    const errors = content
      ? auditPageContent(content, DEFAULT_THEME_TOKENS)
          .filter((i) => i.severity === "error")
          .map((i) => `${i.rule} at ${i.path}: ${i.message}`)
      : [];
    expect(errors).toEqual([]);
  });

  it("has no heading-order warnings", () => {
    const headings = content
      ? auditPageContent(content, DEFAULT_THEME_TOKENS)
          .filter((i) => i.rule === "heading-order")
          .map((i) => `${i.path}: ${i.message}`)
      : [];
    expect(headings).toEqual([]);
  });

  it("gives every image-bearing block a real image", () => {
    expect(missingImages(visits)).toEqual([]);
  });

  it("labels every contentSwitcher item distinctly", () => {
    // Three items all reading "Replace with a name" makes the switcher's
    // own list unreadable — bug #2 from the plan's checklist.
    for (const { block, path } of visits) {
      if (block.type !== "contentSwitcher") continue;
      const items = Array.isArray(block.props?.items) ? (block.props.items as { label?: string }[]) : [];
      const labels = items.map((i) => i?.label ?? "");
      expect(new Set(labels).size, `${path} repeats a switcher label: ${labels.join(" / ")}`).toBe(labels.length);
    }
  });

  it("animates every major section", () => {
    // Checked per top-level
    // section rather than per block — a section counts as animated if
    // anything in its subtree carries an `animation` value, which is how
    // the shipped templates express it (the heading animates, not the
    // wrapper). Every page root is [nav, ...content, footer]; the two
    // chrome sections are excluded, since scroll-revealing a nav bar that
    // is already on screen at load would be a bug, not polish.
    const sections = (content?.root.children ?? []).slice(1, -1);
    const unanimated = sections
      .map((section, i) => {
        const subtree = walk({ version: 1, root: section }, `${slug}[${i}]`);
        const animated = subtree.some((v) => {
          const style = (v.block.style as { base?: Record<string, unknown> } | undefined)?.base ?? {};
          return typeof style.animation === "string" && style.animation !== "";
        });
        return animated ? null : `${section.type}[${i + 1}]`;
      })
      .filter(Boolean);
    expect(unanimated).toEqual([]);
  });
});

describe("dispatcher", () => {
  it("returns null for an unknown template or slug", () => {
    expect(siteTemplatePageContent("saas", "not-a-page")).toBeNull();
    expect(siteTemplatePageContent("not-a-genre", "home")).toBeNull();
  });

  it("builds fresh ids on every call", () => {
    // The POST route creates every page of a template in one transaction;
    // if the builders returned a shared/memoized tree, two pages would
    // share block ids and the editor would address the wrong block.
    const a = siteTemplatePageContent("saas", "home");
    const b = siteTemplatePageContent("saas", "home");
    expect(a?.root.id).not.toBe(b?.root.id);
  });
});
