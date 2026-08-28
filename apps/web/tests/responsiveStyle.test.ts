import { describe, expect, it } from "vitest";
import { autoScaleStyle, buildResponsiveCss, resolveStyle, responsiveColumnCount } from "@/lib/responsiveStyle";
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
