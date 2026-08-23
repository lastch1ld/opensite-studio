import { customFontFaceCss } from "@/lib/customFonts";
import type { CustomFont } from "@/lib/siteSettings";

// One `@font-face` per uploaded font (docs/reference-sites-plan.md Tier
// 4), rendered wherever a site's pages render — see components/blocks/
// registry.tsx's fontFamilyStyle for how a block's `fontFamily` style
// value resolves to the matching font-family name with no further lookup.
export function CustomFontStyles({ fonts }: { fonts: CustomFont[] }) {
  if (fonts.length === 0) return null;
  return <style dangerouslySetInnerHTML={{ __html: customFontFaceCss(fonts) }} />;
}
