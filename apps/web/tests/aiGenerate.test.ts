import { describe, expect, it } from "vitest";
import {
  applyTextSlots,
  buildGenerationPrompt,
  collectTextSlots,
  isPlaceholder,
  parseGeneratedCopy,
} from "@/lib/aiGenerate";
import { siteTemplatePageContent } from "@/lib/siteTemplates";
import type { Block, PageContent } from "@/components/blocks/types";

const block = (id: string, type: string, props: Record<string, unknown>, children?: Block[]): Block => ({
  id,
  type,
  props,
  style: { base: {} },
  children,
});

const page = (children: Block[]): PageContent => ({ version: 1, root: block("root", "section", {}, children) });

describe("isPlaceholder", () => {
  it("recognises the templates' own placeholder convention", () => {
    expect(isPlaceholder("Replace with a headline")).toBe(true);
    expect(isPlaceholder("  replace with a name  ")).toBe(true);
    expect(isPlaceholder("Your site name")).toBe(true);
    expect(isPlaceholder("Simple pricing")).toBe(false);
    expect(isPlaceholder("")).toBe(false);
    expect(isPlaceholder(undefined)).toBe(false);
  });
});

describe("collectTextSlots", () => {
  it("finds placeholder copy in headings, text and buttons", () => {
    const content = page([
      block("h", "heading", { text: "Replace with a headline", level: "h1" }),
      block("t", "text", { content: "Replace with a sentence." }),
      block("b", "button", { label: "Replace with a label", href: "#" }),
    ]);
    expect(collectTextSlots(content, "home")).toEqual([
      { id: "home:h:text", current: "Replace with a headline", kind: "heading" },
      { id: "home:t:content", current: "Replace with a sentence.", kind: "body" },
      { id: "home:b:label", current: "Replace with a label", kind: "label" },
    ]);
  });

  it("skips real copy the template author wrote deliberately", () => {
    // "Simple pricing", "What's on" and nav labels are the template's own
    // words, not slots waiting to be filled.
    const content = page([block("h", "heading", { text: "Simple pricing" }), block("t", "text", { content: "Home" })]);
    expect(collectTextSlots(content, "home")).toEqual([]);
  });

  it("descends the whole tree", () => {
    const content = page([
      block("sec", "section", {}, [block("inner", "heading", { text: "Replace with a nested headline" })]),
    ]);
    expect(collectTextSlots(content, "home").map((s) => s.id)).toEqual(["home:inner:text"]);
  });
});

describe("applyTextSlots", () => {
  const content = page([
    block("h", "heading", { text: "Replace with a headline", level: "h1" }),
    block("t", "text", { content: "Replace with a sentence." }),
  ]);

  it("writes generated copy into the matching blocks", () => {
    const out = applyTextSlots(content, "home", {
      "home:h:text": "Bike repairs in Bolzano",
      "home:t:content": "Same-day tune-ups since 2016.",
    });
    expect((out.root.children![0].props as { text: string }).text).toBe("Bike repairs in Bolzano");
    expect((out.root.children![1].props as { content: string }).content).toBe("Same-day tune-ups since 2016.");
  });

  it("leaves the original untouched", () => {
    applyTextSlots(content, "home", { "home:h:text": "Something else" });
    expect((content.root.children![0].props as { text: string }).text).toBe("Replace with a headline");
  });

  it("ignores ids for a different page", () => {
    const out = applyTextSlots(content, "home", { "about:h:text": "Wrong page" });
    expect((out.root.children![0].props as { text: string }).text).toBe("Replace with a headline");
  });

  it("never overwrites copy someone has already edited", () => {
    const edited = page([block("h", "heading", { text: "Our own headline" })]);
    const out = applyTextSlots(edited, "home", { "home:h:text": "Generated headline" });
    expect((out.root.children![0].props as { text: string }).text).toBe("Our own headline");
  });

  it("ignores blank replacements", () => {
    const out = applyTextSlots(content, "home", { "home:h:text": "   " });
    expect((out.root.children![0].props as { text: string }).text).toBe("Replace with a headline");
  });
});

describe("parseGeneratedCopy", () => {
  const slots = collectTextSlots(page([block("h", "heading", { text: "Replace with a headline" })]), "home");

  it("parses a clean JSON reply", () => {
    expect(parseGeneratedCopy('{"home:h:text": "A real headline"}', slots)).toEqual({ "home:h:text": "A real headline" });
  });

  it("tolerates a code fence and surrounding prose", () => {
    const reply = 'Here you go!\n```json\n{"home:h:text": "A real headline"}\n```\nHope that helps.';
    expect(parseGeneratedCopy(reply, slots)).toEqual({ "home:h:text": "A real headline" });
  });

  it("drops ids that were never asked for", () => {
    // The model inventing a slot id must not become a write to an
    // arbitrary block.
    expect(parseGeneratedCopy('{"home:evil:text": "x", "home:h:text": "ok"}', slots)).toEqual({ "home:h:text": "ok" });
  });

  it("degrades to an empty map rather than throwing on a bad reply", () => {
    // The caller falls back to placeholder copy, which is a usable page.
    expect(parseGeneratedCopy("I'm sorry, I can't help with that.", slots)).toEqual({});
    expect(parseGeneratedCopy("{not json}", slots)).toEqual({});
    expect(parseGeneratedCopy("[]", slots)).toEqual({});
    expect(parseGeneratedCopy("", slots)).toEqual({});
  });

  it("drops non-string and empty values", () => {
    expect(parseGeneratedCopy('{"home:h:text": 42}', slots)).toEqual({});
    expect(parseGeneratedCopy('{"home:h:text": null}', slots)).toEqual({});
    expect(parseGeneratedCopy('{"home:h:text": "  "}', slots)).toEqual({});
  });
});

describe("buildGenerationPrompt", () => {
  it("gives the model an id, a length guide and the placeholder for each slot", () => {
    const slots = collectTextSlots(
      page([block("h", "heading", { text: "Replace with a headline" }), block("b", "button", { label: "Replace with a label" })]),
      "home",
    );
    const prompt = buildGenerationPrompt("A bike shop in Bolzano.", slots);
    expect(prompt).toContain("A bike shop in Bolzano.");
    expect(prompt).toContain("home:h:text\t[at most 10 words, no trailing period]\tReplace with a headline");
    expect(prompt).toContain("home:b:label\t[at most 4 words, title case]\tReplace with a label");
  });
});

describe("against the real templates", () => {
  it("finds slots on every genre's home page and can round-trip them", () => {
    for (const genre of ["saas", "agency", "portfolio", "restaurant", "hotel", "bar"]) {
      const content = siteTemplatePageContent(genre, "home")!;
      const slots = collectTextSlots(content, "home");
      expect(slots.length, genre).toBeGreaterThan(5);
      expect(new Set(slots.map((s) => s.id)).size, `${genre} slot ids must be unique`).toBe(slots.length);

      const values = Object.fromEntries(slots.map((s) => [s.id, "Generated copy"]));
      const filled = applyTextSlots(content, "home", values);
      expect(collectTextSlots(filled, "home"), `${genre} should have no placeholders left`).toEqual([]);
    }
  });
});
