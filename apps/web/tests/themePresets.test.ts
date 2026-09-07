import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_TOKENS } from "@/lib/theme";
import { THEME_PRESETS, themePresetById } from "@/lib/themePresets";
import { contrastRatio, parseColor } from "@/lib/a11y";

const ratio = (fg: string, bg: string) => contrastRatio(parseColor(fg)!, parseColor(bg)!);

describe("theme presets", () => {
  it("offers a small, distinct set", () => {
    // docs/ui-ux-roadmap.md: "3–4 genuinely distinct, well-chosen palettes",
    // explicitly not a marketplace.
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(3);
    expect(THEME_PRESETS.length).toBeLessThanOrEqual(6);
    const ids = THEME_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const grounds = THEME_PRESETS.map((p) => p.tokens.colors.background);
    expect(new Set(grounds).size).toBe(grounds.length);
  });

  it("declares the same token keys as the default theme", () => {
    // A preset missing a key would leave a block bound to that token
    // resolving to nothing after the preset is applied.
    for (const preset of THEME_PRESETS) {
      for (const category of ["colors", "typography", "spacing"] as const) {
        expect(Object.keys(preset.tokens[category]).sort(), `${preset.id}.${category}`).toEqual(
          Object.keys(DEFAULT_THEME_TOKENS[category]).sort(),
        );
      }
    }
  });

  it("stays readable — these ship as-is or not at all", () => {
    for (const { id, tokens } of THEME_PRESETS) {
      const { background, text, primary, secondary } = tokens.colors;
      expect(ratio(text, background), `${id}: body text on background`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(secondary, background), `${id}: secondary text on background`).toBeGreaterThanOrEqual(4.5);
      // `primary` is the button-surface color: it needs a readable white
      // label (WCAG AA text) and to be distinguishable from the page it
      // sits on (WCAG 1.4.11's 3:1 non-text threshold).
      expect(ratio("#ffffff", primary), `${id}: white label on primary`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(primary, background), `${id}: primary against background`).toBeGreaterThanOrEqual(3);
    }
  });

  it("looks presets up by id", () => {
    expect(themePresetById("signal")?.name).toBe("Signal");
    expect(themePresetById("nope")).toBeUndefined();
  });
});
