import type { ThemeTokens } from "./theme";

// docs/ui-ux-roadmap.md: "a handful of theme presets ... 3–4
// genuinely distinct, well-chosen palettes rather than a color picker with
// no starting point". A new Site's Theme is otherwise seeded with
// DEFAULT_THEME_TOKENS (lib/theme.ts) — a generic blue that reads as
// "nobody has chosen anything yet".
//
// Plain data with no Node built-ins, same client-safe split as
// lib/siteTemplateOptions.ts: the site-creation form imports this
// directly, and so does the API route that applies it.
//
// Every preset's `text` clears WCAG AA (4.5:1) on its own `background`,
// and `primary` is dark enough to carry white button text — the presets
// are starting points a non-designer will ship as-is, so an unreadable
// one is worse than no preset at all (tests/themePresets.test.ts).

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  tokens: ThemeTokens;
};

const SCALE = {
  typography: { sm: "14px", base: "16px", lg: "24px", xl: "32px" },
  spacing: { sm: "8px", md: "16px", lg: "24px", xl: "48px" },
};

const EDITORIAL_SCALE = {
  typography: { sm: "14px", base: "17px", lg: "26px", xl: "40px" },
  spacing: { sm: "8px", md: "20px", lg: "32px", xl: "64px" },
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "signal",
    name: "Signal",
    description: "Cool near-black on white with an indigo accent — the safe, modern default.",
    tokens: {
      colors: { primary: "#4338CA", secondary: "#64748B", background: "#FFFFFF", text: "#0F172A" },
      ...SCALE,
    },
  },
  {
    id: "ink",
    name: "Ink",
    description: "Monochrome and confident: near-black on warm paper, one deep green accent.",
    tokens: {
      colors: { primary: "#1F4D3A", secondary: "#6E6C63", background: "#F5F3EE", text: "#1A1917" },
      ...EDITORIAL_SCALE,
    },
  },
  {
    id: "terrace",
    name: "Terrace",
    description: "Warm hospitality: cream ground, clay accent, softened brown-black text.",
    tokens: {
      colors: { primary: "#A9522E", secondary: "#7A6A57", background: "#FBF5EC", text: "#26201A" },
      ...EDITORIAL_SCALE,
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark ground with a deep cyan accent — for product and portfolio sites that lead dark.",
    tokens: {
      // Deeper than the obvious bright cyan: an accent used as a button
      // surface has to carry a white label (4.65:1 here), and a brighter
      // cyan only manages 2.8:1 against white.
      colors: { primary: "#1C7F94", secondary: "#94A3B8", background: "#0E1418", text: "#EDF2F4" },
      ...SCALE,
    },
  },
];

export function themePresetById(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}
