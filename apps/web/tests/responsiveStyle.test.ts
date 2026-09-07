import { describe, expect, it } from "vitest";
import {
  autoScaleStyle,
  buildResponsiveCss,
  columnsResponsiveCss,
  cssStringValue,
  resolveStyle,
  responsiveColumnCount,
} from "@/lib/responsiveStyle";
import { DEFAULT_THEME_TOKENS } from "@/lib/theme";

describe("autoScaleStyle", () => {
  it("scales type down at each breakpoint", () => {
    expect(autoScaleStyle({ fontSize: "104px" }, "tablet")).toEqual({ fontSize: "88px" });
    expect(autoScaleStyle({ fontSize: "104px" }, "mobile")).toEqual({ fontSize: "75px" });
  });

  it("leaves body-sized type alone", () => {
    // Shrinking 16px copy to 11px trades one unreadable layout for another.
    expect(autoScaleStyle({ fontSize: "16px" }, "mobile")).toEqual({});
    expect(autoScaleStyle({ fontSize: "14px" }, "mobile")).toEqual({});
    // 17px scales, but only down to the floor.
    expect(autoScaleStyle({ fontSize: "17px" }, "mobile")).toEqual({ fontSize: "16px" });
  });

  it("scales every component of a padding shorthand", () => {
    expect(autoScaleStyle({ padding: "96px 40px" }, "mobile")).toEqual({ padding: "60px 25px" });
    expect(autoScaleStyle({ padding: "80px 40px 72px" }, "tablet")).toEqual({ padding: "64px 32px 58px" });
  });

  it("ignores values it can't scale meaningfully", () => {
    expect(autoScaleStyle({ padding: "0" }, "mobile")).toEqual({});
    expect(autoScaleStyle({ gap: "2rem" }, "mobile")).toEqual({});
    expect(autoScaleStyle({ fontSize: "clamp(1rem, 5vw, 3rem)" }, "mobile")).toEqual({});
  });

  it("only touches type and spacing keys", () => {
    // A 70px divider or a 12px corner radius is not a typographic scale.
    expect(autoScaleStyle({ height: "70px", borderRadius: "24px", width: "600px" }, "mobile")).toEqual({});
    expect(autoScaleStyle({ color: "#111111", background: "#ffffff" }, "mobile")).toEqual({});
  });
});

describe("resolveStyle", () => {
  it("returns base untouched at the desktop breakpoint", () => {
    const style = { base: { fontSize: "104px", padding: "96px" } };
    expect(resolveStyle(style, "base")).toEqual({ fontSize: "104px", padding: "96px" });
  });

  it("fills in derived values where the author said nothing", () => {
    const style = { base: { fontSize: "104px", color: "#111111" } };
    expect(resolveStyle(style, "mobile")).toEqual({ fontSize: "75px", color: "#111111" });
  });

  it("lets an explicit override beat the derived value", () => {
    const style = { base: { fontSize: "104px" }, mobile: { fontSize: "40px" } };
    expect(resolveStyle(style, "mobile")).toEqual({ fontSize: "40px" });
  });

  it("inherits an explicit tablet value at mobile rather than re-deriving from base", () => {
    // Desktop-first cascade: the author's tablet decision carries down to
    // mobile, which is what it did before auto-scaling existed.
    const style = { base: { fontSize: "104px" }, tablet: { fontSize: "60px" } };
    expect(resolveStyle(style, "mobile")).toEqual({ fontSize: "60px" });
  });

  it("handles a block with no style at all", () => {
    expect(resolveStyle(undefined, "mobile")).toEqual({});
    expect(resolveStyle({}, "tablet")).toEqual({});
  });
});

describe("buildResponsiveCss", () => {
  it("emits derived rules for a block with no explicit overrides", () => {
    // The public renderer puts base values in an inline style attribute, so
    // without a rule here the derived value would never reach the page.
    const css = buildResponsiveCss("b1", { base: { fontSize: "104px" } });
    expect(css).toContain("@media (max-width:991px)");
    expect(css).toContain("font-size:88px !important;");
    expect(css).toContain("@media (max-width:767px)");
    expect(css).toContain("font-size:75px !important;");
  });

  it("still emits nothing for a block with nothing to scale or override", () => {
    expect(buildResponsiveCss("b1", { base: { color: "#111111" } })).toBeNull();
    expect(buildResponsiveCss("b1", undefined)).toBeNull();
  });

  it("resolves theme tokens before scaling", () => {
    // typography.xl is 32px in the default theme.
    const css = buildResponsiveCss("b1", { base: { fontSize: { $token: "typography.xl" } } }, DEFAULT_THEME_TOKENS);
    expect(css).toContain("font-size:27px !important;");
    expect(css).toContain("font-size:23px !important;");
  });

  it("keeps an explicit override in the emitted rule", () => {
    const css = buildResponsiveCss("b1", { base: { fontSize: "104px" }, mobile: { fontSize: "40px" } });
    expect(css).toContain("font-size:40px !important;");
    expect(css).not.toContain("font-size:75px");
  });
});

describe("responsiveColumnCount", () => {
  it("collapses grids the same way as before", () => {
    expect(responsiveColumnCount(4, "base")).toBe(4);
    expect(responsiveColumnCount(4, "tablet")).toBe(2);
    expect(responsiveColumnCount(4, "mobile")).toBe(1);
    expect(responsiveColumnCount(1, "tablet")).toBe(1);
  });
});

// The page API stores a block tree as the opaque JSON the client sent, so
// block ids and style values are attacker-controlled by anyone who can
// edit a page — and this CSS renders inside a <style> element on both the
// published site and the dashboard's own editor canvas.
describe("CSS injection through the block tree", () => {
  const BREAKOUT = 'x"]{}</style><script>alert(1)</script><style>[a="';

  it("escapes an id that would close the style element", () => {
    const escaped = cssStringValue(BREAKOUT);
    expect(escaped).not.toContain("</style");
    expect(escaped).not.toContain('"');
    // Escaped, not stripped: the value still resolves to the same string,
    // so the selector keeps matching the element's real data-block-id.
    expect(escaped).toContain("\\22 ");
    expect(escaped).toContain("\\3c ");
  });

  it("leaves an ordinary block id untouched", () => {
    expect(cssStringValue("blk_01HXYZ-42")).toBe("blk_01HXYZ-42");
    expect(buildResponsiveCss("blk_1", { base: { fontSize: "104px" } })).toContain('[data-block-id="blk_1"]');
  });

  it("cannot break out of either generated selector", () => {
    const responsive = buildResponsiveCss(BREAKOUT, { base: { fontSize: "104px" } }) ?? "";
    expect(responsive).not.toContain("</style");
    expect(responsive).not.toContain("<script");
    expect(columnsResponsiveCss(BREAKOUT, 3)).not.toContain("</style");
  });

  it("drops a declaration that would escape its rule, and keeps real ones", () => {
    const hostile = buildResponsiveCss("b1", {
      base: { fontSize: "104px" },
      mobile: { color: "red}</style><script>alert(1)</script>" },
    }) ?? "";
    expect(hostile).not.toContain("</style");
    expect(hostile).not.toContain("color:red}");

    // Commas, quotes, parens and slashes are all legitimate CSS.
    const real = buildResponsiveCss("b1", {
      base: { fontSize: "104px" },
      mobile: { fontFamily: '"Space Grotesk", system-ui, sans-serif', background: "rgb(0, 0, 0)", font: "12px/1.5 serif" },
    }) ?? "";
    expect(real).toContain('font-family:"Space Grotesk", system-ui, sans-serif !important');
    expect(real).toContain("background:rgb(0, 0, 0) !important");
    expect(real).toContain("font:12px/1.5 serif !important");
  });
});
