// Theme tokens: a small, flat semantic palette/scale a Site's blocks can
// reference instead of hardcoding literals. First pass only covers colors,
// a font-size scale, and a spacing scale (data-model.md's Theme spec) —
// font families/weights and richer typography are future work.
export type ThemeTokens = {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
};

export type TokenCategory = keyof ThemeTokens;

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  colors: {
    primary: "#2563eb",
    secondary: "#64748b",
    background: "#ffffff",
    text: "#111111",
  },
  typography: {
    sm: "14px",
    base: "16px",
    lg: "24px",
    xl: "32px",
  },
  spacing: {
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "48px",
  },
};

export function tokenOptionsFor(theme: ThemeTokens, category: TokenCategory): { label: string; value: string }[] {
  return Object.keys(theme[category] ?? {}).map((key) => ({ label: key, value: `${category}.${key}` }));
}
