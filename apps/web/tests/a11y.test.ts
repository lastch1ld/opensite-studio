import { describe, expect, it } from "vitest";
import { auditPageContent, contrastRatio, parseColor } from "@/lib/a11y";
import { DEFAULT_THEME_TOKENS } from "@/lib/theme";
import { siteTemplatePageContent } from "@/lib/siteTemplates";
import type { Block, PageContent } from "@/components/blocks/types";

const block = (type: string, props: Record<string, unknown>, style: Record<string, unknown> = {}, children?: Block[]): Block => ({
  id: `${type}-${Math.random().toString(36).slice(2)}`,
  type,
  props,
  style: { base: style },
  children,
});

const page = (children: Block[], rootStyle: Record<string, unknown> = {}): PageContent => ({
  version: 1,
  root: block("section", { layout: "stack" }, { background: "#ffffff", ...rootStyle }, children),
});

const rules = (content: PageContent) => auditPageContent(content, DEFAULT_THEME_TOKENS).map((i) => i.rule);

describe("color math", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio(parseColor("#000000")!, parseColor("#ffffff")!)).toBeCloseTo(21, 5);
    expect(contrastRatio(parseColor("#ffffff")!, parseColor("#ffffff")!)).toBeCloseTo(1, 5);
    // Order must not matter — the ratio is defined on lighter/darker.
    expect(contrastRatio(parseColor("#777777")!, parseColor("#ffffff")!)).toBeCloseTo(
      contrastRatio(parseColor("#ffffff")!, parseColor("#777777")!),
      5,
    );
  });

  it("parses the color forms a block style can hold", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor("#FF8000")).toEqual([255, 128, 0]);
    expect(parseColor("rgb(1, 2, 3)")).toEqual([1, 2, 3]);
    expect(parseColor("rgba(1,2,3,0.5)")).toEqual([1, 2, 3]);
    // Not a flat color — must be skipped rather than guessed at.
    expect(parseColor("linear-gradient(#fff, #000)")).toBeNull();
    expect(parseColor("transparent")).toBeNull();
    expect(parseColor(undefined)).toBeNull();
  });
});

describe("auditPageContent", () => {
  it("flags an image with no alt text", () => {
    expect(rules(page([block("image", { src: "https://placehold.co/10x10", alt: "" })]))).toContain("image-alt");
    expect(rules(page([block("image", { src: "https://placehold.co/10x10", alt: "A described image" })]))).not.toContain(
      "image-alt",
    );
  });

  it("flags low-contrast text against the section it sits on", () => {
    const faint = page([block("text", { content: "hi" }, { color: "#cccccc", fontSize: "16px" })]);
    expect(rules(faint)).toContain("contrast");
    const fine = page([block("text", { content: "hi" }, { color: "#111111", fontSize: "16px" })]);
    expect(rules(fine)).not.toContain("contrast");
  });

  it("applies the large-text threshold", () => {
    // 3.03:1 — fails the 4.5 body threshold, passes the 3.0 large one.
    const style = { color: "#949494", background: undefined };
    expect(rules(page([block("heading", { text: "h", level: "h1" }, { ...style, fontSize: "16px" })]))).toContain("contrast");
    expect(rules(page([block("heading", { text: "h", level: "h1" }, { ...style, fontSize: "32px" })]))).not.toContain(
      "contrast",
    );
  });

  it("inherits the nearest ancestor background", () => {
    const onDark = page([
      block("section", { layout: "stack" }, { background: "#111111" }, [
        block("text", { content: "hi" }, { color: "#222222" }),
      ]),
    ]);
    expect(rules(onDark)).toContain("contrast");
  });

  it("resolves theme tokens before measuring", () => {
    // background token is #ffffff and text token #111111 in the default
    // theme — a checker that compared the raw `{$token}` objects would
    // silently pass everything.
    const tokened: PageContent = {
      version: 1,
      root: block("section", { layout: "stack" }, { background: { $token: "colors.background" } }, [
        block("text", { content: "hi" }, { color: { $token: "colors.background" } }),
      ]),
    };
    expect(rules(tokened)).toContain("contrast");
  });

  it("skips badges, which paint their own background", () => {
    const badge = page([block("text", { content: "New" }, { displayAs: "badge", color: "#eeeeee" })]);
    expect(rules(badge)).not.toContain("contrast");
  });

  it("flags unnamed controls and dead links", () => {
    expect(rules(page([block("button", { label: "", href: "/x" })]))).toContain("control-name");
    expect(rules(page([block("button", { label: "Go", href: "#" })]))).toContain("link-target");
    expect(rules(page([block("button", { label: "Go", href: "/x" })]))).toEqual([]);
  });

  it("flags a form field with no label", () => {
    expect(rules(page([block("form", { fields: [{ id: "1", type: "text", label: "" }] })]))).toContain("field-label");
  });

  it("flags heading structure problems", () => {
    expect(rules(page([block("heading", { text: "a", level: "h2" })]))).toContain("heading-order");
    expect(
      rules(page([block("heading", { text: "a", level: "h1" }), block("heading", { text: "b", level: "h1" })])),
    ).toContain("heading-order");
    expect(
      rules(page([block("heading", { text: "a", level: "h1" }), block("heading", { text: "b", level: "h4" })])),
    ).toContain("heading-order");
    expect(
      rules(page([block("heading", { text: "a", level: "h1" }), block("heading", { text: "b", level: "h2" })])),
    ).toEqual([]);
  });

  it("reports nothing on an empty page", () => {
    expect(rules(page([]))).toEqual([]);
  });
});

describe("the shipped site templates", () => {
  // The templates are what a new site starts from, so they set the floor
  // for every site built on this product.
  it("have no contrast errors", () => {
    const contrast = ["saas", "agency", "portfolio", "restaurant", "hotel", "bar"].flatMap((genre) =>
      ["home", "about", "contact"].flatMap((slug) => {
        const content = siteTemplatePageContent(genre, slug);
        return content
          ? auditPageContent(content, DEFAULT_THEME_TOKENS)
              .filter((i) => i.rule === "contrast")
              .map((i) => `${genre}/${slug} ${i.path}: ${i.message}`)
          : [];
      }),
    );
    expect(contrast).toEqual([]);
  });
});
