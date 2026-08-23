import type { CustomFont } from "./siteSettings";

// The actual CSS `font-family` name every uploaded font renders under —
// deterministic from its id so a block's stored style value
// (`custom:opensite-custom-<id>`, see components/blocks/registry.tsx's
// fontFamilyStyle) never needs a side lookup against the site's font list
// to know what to render; it just needs the matching `@font-face` to be
// present somewhere on the page, which customFontFaceCss below provides.
export function customFontCssName(fontId: string): string {
  return `opensite-custom-${fontId}`;
}

// The FONT_FIELD select option value for a given custom font — carries a
// "custom:" prefix so components/blocks/registry.tsx's fontFamilyStyle can
// tell it apart from the five curated FONT_STACKS keys (plain strings like
// "space-grotesk") without needing to know the site's font list either.
export function customFontFieldValue(fontId: string): string {
  return `custom:${customFontCssName(fontId)}`;
}

// Renders one `@font-face` rule per registered custom font. Meant to be
// embedded via a `<style>` tag wherever a site's pages render — the editor
// canvas, the draft /preview route, and the public site route all need
// this present for a block referencing a custom font to actually show it,
// not just the page that happens to be "published" at any given moment.
export function customFontFaceCss(fonts: CustomFont[]): string {
  return fonts
    .map((font) => `@font-face{font-family:"${customFontCssName(font.id)}";src:url("${font.url}") format("${font.format}");font-display:swap;}`)
    .join("\n");
}
