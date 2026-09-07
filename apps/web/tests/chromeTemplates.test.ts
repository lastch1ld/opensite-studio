import { describe, expect, it } from "vitest";
import { defaultFooterContent, defaultHeaderContent, starterTemplateContent } from "@/lib/chromeTemplates";
import { DEFAULT_THEME_TOKENS } from "@/lib/theme";
import { registeredBlockTypes } from "./support/registry";
import { walk } from "./support/blockAudit";

const known = new Set(registeredBlockTypes());

function tokenRefs(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => tokenRefs(v, out));
  else if (value && typeof value === "object") {
    const bind = (value as { $token?: unknown }).$token;
    if (typeof bind === "string") out.push(bind);
    else Object.values(value).forEach((v) => tokenRefs(v, out));
  }
  return out;
}

describe.each([
  ["header", defaultHeaderContent()],
  ["footer", defaultFooterContent()],
])("default %s template", (label, content) => {
  const visits = walk(content, label);

  it("uses only registered block types", () => {
    expect(visits.filter((v) => !known.has(v.block.type)).map((v) => v.path)).toEqual([]);
  });

  it("gives every block a unique id", () => {
    const ids = visits.map((v) => v.block.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references only tokens the theme actually defines", () => {
    // Every style value here is a `$token` so the chrome inherits whichever
    // theme preset the site started from — a typo'd path would resolve to
    // nothing and silently drop the style.
    for (const ref of tokenRefs(content.root)) {
      const [category, key] = ref.split(".");
      expect(
        DEFAULT_THEME_TOKENS[category as keyof typeof DEFAULT_THEME_TOKENS]?.[key],
        `unknown token ${ref}`,
      ).toBeDefined();
    }
  });

  it("builds fresh ids per call", () => {
    expect(starterTemplateContent(label)!.root.id).not.toBe(starterTemplateContent(label)!.root.id);
  });
});

describe("starterTemplateContent", () => {
  it("only seeds header and footer", () => {
    expect(starterTemplateContent("header")).not.toBeNull();
    expect(starterTemplateContent("footer")).not.toBeNull();
    expect(starterTemplateContent("pageTemplate")).toBeNull();
    expect(starterTemplateContent("popup")).toBeNull();
    expect(starterTemplateContent("collectionItemTemplate")).toBeNull();
  });
});
