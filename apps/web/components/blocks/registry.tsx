import type { CSSProperties } from "react";
import { registerBlock, getBlockDefinition, getAllBlockDefinitions } from "@opensite/block-sdk";
import type { BlockDefinition } from "@opensite/block-sdk";
import type {
  AccordionItem,
  Block,
  BlockImage,
  ComparisonColumn,
  ComparisonRow,
  ContentSwitcherItem,
  FieldSchema,
  FormField,
  PricingTier,
} from "./types";
import { columnsResponsiveCss, hasContainerChildren, responsiveColumnCount } from "@/lib/responsiveStyle";
import { FormBlock } from "./FormBlock";
import { NewsletterBlock } from "./NewsletterBlock";
import { AccordionBlock } from "./AccordionBlock";
import { StatCounterBlock } from "./StatCounterBlock";
import { ContentSwitcherBlock } from "./ContentSwitcherBlock";
import { BeforeAfterBlock } from "./BeforeAfterBlock";
import { SliderBlock } from "./SliderBlock";
import type { RenderContext } from "@/lib/bind";

// This file is the one place apps/web's built-in blocks get registered —
// the registration *mechanism* itself (types + `registerBlock` + lookup)
// lives in @opensite/block-sdk (docs/plugin-sdk.md), shared with whatever
// plugins get loaded from /plugins (lib/plugins/loadPlugins.ts). Built-in
// blocks stay defined here; they don't need to move into the SDK package,
// only the mechanism does.
export type AppBlockDef = BlockDefinition<RenderContext>;

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

// "comparisonTable" cell rendering: "yes"/"no" (and common synonyms) render
// as check/cross marks, anything else renders as its own text — lets a
// cell hold a quantity or short phrase ("Limited", "$10/mo") instead of
// only a boolean.
function renderComparisonCell(value: string) {
  const v = value.trim().toLowerCase();
  if (v === "yes" || v === "true" || v === "✓") return <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>;
  if (v === "no" || v === "false" || v === "✗" || v === "x") return <span style={{ color: "#d1d5db" }}>—</span>;
  return value;
}

// Shared "offset position" fields (docs/ui-ux-roadmap.md: "offset
// positioning ... for more fluid layouts") — nudges a block via
// `transform: translate()` rather than margin, so it shifts visually
// without disturbing sibling layout or the flow container's own size,
// enabling deliberately overlapping/organic compositions. `position:
// relative` only applies once an offset is actually set, so a block with
// no offset renders exactly as it did before this existed. `zIndex` lets
// an offset block that now overlaps a neighbor control which one stacks
// on top.
const OFFSET_FIELDS: FieldSchema[] = [
  { key: "offsetX", label: "Offset X", friendlyLabel: "Move sideways", group: "style", input: "text" },
  { key: "offsetY", label: "Offset Y", friendlyLabel: "Move up/down", group: "style", input: "text" },
  { key: "zIndex", label: "Stack order", friendlyLabel: "Bring to front / send to back", group: "style", input: "text" },
];

// Scroll-in animation (docs/ui-ux-roadmap.md: "add motion.dev ... where
// possible as options") — one shared field appended to every built-in
// block's inspector below, resolved generically in BlockRenderer.tsx
// (not per block-type) so it works uniformly across the whole registry,
// built-in or plugin-authored, without each block having to opt in.
export const ANIMATION_FIELD: FieldSchema = {
  key: "animation",
  label: "Animation",
  friendlyLabel: "Animate in on scroll",
  group: "style",
  input: "select",
  options: [
    { label: "None", value: "" },
    { label: "Fade in", value: "fade-in" },
    { label: "Slide up", value: "slide-up" },
    { label: "Slide down", value: "slide-down" },
    { label: "Slide in from left", value: "slide-left" },
    { label: "Slide in from right", value: "slide-right" },
    { label: "Scale in", value: "scale-in" },
  ],
};

// docs/reference-sites-plan.md Tier 3: the same fade/slide/scale variants
// above, but driven continuously by scroll *progress* instead of firing
// once — several reference sites (confirmed via direct script/DOM
// inspection, not just visual impression) turned out to use this rather
// than a one-shot reveal. Resolved generically in BlockRenderer.tsx via
// motion's useScroll/useTransform (already a dependency, no new library).
// Meaningless without an `animation` value set, so this is a trigger mode
// for that field rather than a separate on/off toggle.
export const ANIMATION_MODE_FIELD: FieldSchema = {
  key: "animationMode",
  label: "Animation trigger",
  friendlyLabel: "How the animation plays",
  group: "style",
  input: "select",
  options: [
    { label: "Once, when scrolled into view", value: "" },
    { label: "Continuously, tied to scroll position", value: "scrub" },
  ],
};

// docs/reference-sites-plan.md Tier 3: `position: sticky` as a single
// shared style toggle, appended to every block like ANIMATION_FIELD —
// unlocks the "pinned while sibling content scrolls past" half of several
// reference patterns (NKORA/Karolina Hess/Métier) without touching the
// animation system at all.
export const STICKY_FIELD: FieldSchema = {
  key: "sticky",
  label: "Sticky position",
  friendlyLabel: "Pin in place while scrolling",
  group: "style",
  input: "select",
  options: [
    { label: "No (default)", value: "" },
    { label: "Yes", value: "true" },
  ],
};

export const STICKY_OFFSET_FIELD: FieldSchema = {
  key: "stickyOffset",
  label: "Sticky offset from top",
  friendlyLabel: "Distance from top when pinned",
  group: "style",
  input: "text",
};

// docs/reference-sites-plan.md Tier 4 (Métier's paper-grain background).
// A single feTurbulence-filtered SVG, tiled at 200x200px — cheap (one
// data URI, no image upload) and generic enough to layer under any solid
// background color. Only offered on "section"/"hero" (the two block
// types with a background at all), not appended universally like
// ANIMATION_FIELD/STICKY_FIELD.
const NOISE_TEXTURE_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E";

const BACKGROUND_TEXTURE_FIELD: FieldSchema = {
  key: "backgroundTexture",
  label: "Background texture",
  friendlyLabel: "Add a subtle texture",
  group: "style",
  input: "select",
  options: [
    { label: "None (default)", value: "" },
    { label: "Paper grain", value: "grain" },
  ],
};

// docs/reference-sites-plan.md Tier 5: status/tag badges on Collection-
// bound list items (Accoutrement's "Sold Out"/"Only 1 Room Left",
// Banh Mi & You's "vegan" tag) — maps onto the existing `text` block
// (typically bound via `$bind` to a Collection field inside a `list`
// item template) rather than a new block type, per the plan's own framing.
// A small closed set of semantic tones rather than a raw color picker,
// matching how a non-technical editor thinks about status ("this is bad
// news" vs "this is fine") rather than picking hex values.
const BADGE_TONES: Record<string, { bg: string; fg: string }> = {
  neutral: { bg: "#f3f4f6", fg: "#374151" },
  success: { bg: "#dcfce7", fg: "#15803d" },
  warning: { bg: "#fef3c7", fg: "#92400e" },
  danger: { bg: "#fee2e2", fg: "#b91c1c" },
};

const DISPLAY_AS_BADGE_FIELD: FieldSchema = {
  key: "displayAs",
  label: "Display as",
  friendlyLabel: "Show as a badge",
  group: "style",
  input: "select",
  options: [
    { label: "Text (default)", value: "" },
    { label: "Badge", value: "badge" },
  ],
};

const BADGE_TONE_FIELD: FieldSchema = {
  key: "badgeTone",
  label: "Badge color",
  group: "style",
  input: "select",
  options: [
    { label: "Neutral", value: "neutral" },
    { label: "Success (green)", value: "success" },
    { label: "Warning (amber)", value: "warning" },
    { label: "Danger (red)", value: "danger" },
  ],
};

function offsetStyle(style: Record<string, unknown>): CSSProperties {
  const x = str(style.offsetX);
  const y = str(style.offsetY);
  const z = str(style.zIndex);
  if (!x && !y && !z) return {};
  return {
    position: "relative",
    transform: x || y ? `translate(${x || "0"}, ${y || "0"})` : undefined,
    zIndex: z || undefined,
  };
}

// Maps a select value to the CSS variable next/font/google set up in
// app/layout.tsx — never an inline family name, so every font reference
// stays a named token (same reasoning as Theme's colour/spacing tokens):
// changing a font later is a one-line swap in layout.tsx, not a find-
// replace across every block that used it. Deliberately a short, curated
// list (one geometric-sans, one high-contrast serif, one classical serif,
// one mono, one rounded-humanist-sans) rather than open-ended Google
// Fonts access — enough to pair a distinctive display face against the
// body default without turning this into a general font-picker feature.
const FONT_STACKS: Record<string, string> = {
  "space-grotesk": "var(--font-space-grotesk), ui-sans-serif, sans-serif",
  fraunces: "var(--font-fraunces), ui-serif, serif",
  "instrument-serif": "var(--font-instrument-serif), ui-serif, serif",
  "plex-mono": "var(--font-plex-mono), ui-monospace, monospace",
  "jakarta-sans": "var(--font-jakarta-sans), ui-sans-serif, sans-serif",
};

const FONT_FIELD: FieldSchema = {
  key: "fontFamily",
  label: "Font",
  friendlyLabel: "Font style",
  group: "style",
  input: "select",
  options: [
    { label: "Default", value: "" },
    { label: "Space Grotesk (geometric)", value: "space-grotesk" },
    { label: "Fraunces (editorial serif)", value: "fraunces" },
    { label: "Instrument Serif (classical)", value: "instrument-serif" },
    { label: "IBM Plex Mono (technical)", value: "plex-mono" },
    { label: "Plus Jakarta Sans (rounded)", value: "jakarta-sans" },
  ],
};

function fontFamilyStyle(style: Record<string, unknown>): CSSProperties {
  const key = str(style.fontFamily);
  // A site's uploaded fonts (lib/customFonts.ts's customFontFieldValue) —
  // the value itself already carries the exact CSS font-family name to
  // use, so this needs no lookup against the site's font list; it just
  // needs the matching @font-face to be present somewhere on the page
  // (injected by CustomFontStyles wherever pages render).
  if (key.startsWith("custom:")) {
    return { fontFamily: `"${key.slice(7)}", ui-sans-serif, sans-serif` };
  }
  const stack = FONT_STACKS[key];
  return stack ? { fontFamily: stack } : {};
}

const builtinBlocks: Record<string, Omit<AppBlockDef, "type">> = {
  section: {
    label: "Section",
    defaultProps: { layout: "stack" },
    defaultStyle: { padding: "24px", background: "#ffffff" },
    inspector: [
      {
        key: "layout",
        label: "Layout",
        friendlyLabel: "Arrange items",
        group: "props",
        input: "select",
        options: [
          { label: "Stack (vertical)", value: "stack" },
          { label: "Row (horizontal)", value: "row" },
        ],
      },
      { key: "padding", label: "Padding", friendlyLabel: "Inner spacing", group: "style", input: "text", tokenCategory: "spacing" },
      { key: "background", label: "Background", friendlyLabel: "Background color", group: "style", input: "color", tokenCategory: "colors" },
      // Optional: caps a section's content width and centers it (e.g.
      // "1100px"), so a full-bleed background can still hold a readable
      // centered column — unset behaves exactly as before (full-width).
      { key: "maxWidth", label: "Max content width", friendlyLabel: "Content width", group: "style", input: "text" },
      {
        key: "align",
        label: "Align items (cross-axis)",
        friendlyLabel: "Alignment",
        group: "style",
        input: "select",
        options: [
          { label: "Stretch (default)", value: "" },
          { label: "Start", value: "flex-start" },
          { label: "Center", value: "center" },
          { label: "End", value: "flex-end" },
        ],
      },
      {
        key: "justify",
        label: "Justify content (main-axis)",
        friendlyLabel: "Content position",
        group: "style",
        input: "select",
        options: [
          { label: "Start (default)", value: "" },
          { label: "Center", value: "center" },
          { label: "End", value: "flex-end" },
          { label: "Space between", value: "space-between" },
        ],
      },
      { key: "gap", label: "Gap", friendlyLabel: "Space between items", group: "style", input: "text", tokenCategory: "spacing" },
      { key: "borderRadius", label: "Corner radius", friendlyLabel: "Rounded corners", group: "style", input: "text" },
      BACKGROUND_TEXTURE_FIELD,
    ],
    render(props, style, children) {
      const layout = str(props.layout, "stack");
      const maxWidth = str(style.maxWidth);
      const align = str(style.align);
      const justify = str(style.justify);
      const texture = str(style.backgroundTexture) === "grain";
      const cssStyle: CSSProperties = {
        padding: str(style.padding, "24px"),
        backgroundColor: str(style.background, "#ffffff"),
        ...(texture ? { backgroundImage: `url("${NOISE_TEXTURE_DATA_URI}")`, backgroundSize: "200px 200px", backgroundRepeat: "repeat" } : {}),
        display: "flex",
        flexDirection: layout === "row" ? "row" : "column",
        gap: str(style.gap, "12px"),
        minHeight: "40px",
        boxSizing: "border-box",
        borderRadius: str(style.borderRadius, "0"),
        ...(maxWidth ? { maxWidth, marginLeft: "auto", marginRight: "auto" } : {}),
        ...(align ? { alignItems: align as CSSProperties["alignItems"] } : {}),
        ...(justify ? { justifyContent: justify as CSSProperties["justifyContent"] } : {}),
      };
      return <div style={cssStyle}>{children}</div>;
    },
  },
  // A ready-made hero: eyebrow/heading/subheading/CTA bundled as flat
  // props (no child blocks to assemble) so a non-technical editor gets a
  // finished hero in one drop, not a section they have to compose
  // themselves. Always breaks out to true full-bleed width via the
  // standard 100vw/-50vw CSS technique — a plain `section` only reaches
  // full width if EVERY ancestor up to the page root also has zero
  // padding, which isn't true by default (the root section itself starts
  // with 24px padding, see lib/pageContent.ts's emptyPageContent). This
  // block ignores its container's padding entirely, by design.
  // A real container (children, not flat props) so every part of a hero
  // is fully editable/removable/rearrangeable like any other block tree —
  // seeded with a finished eyebrow/heading/subheading/button composition
  // on creation (see `heroDefaultChildren` + `createBlock` below) so it
  // still looks complete the moment it's added, rather than starting
  // empty like a plain Section does.
  hero: {
    label: "Hero",
    fullBleed: true,
    defaultProps: { backgroundImage: "" },
    defaultStyle: { background: "#0B1120", padding: "96px 24px", contentWidth: "700px", align: "center", gap: "20px" },
    inspector: [
      { key: "backgroundImage", label: "Background image", friendlyLabel: "Background image (optional)", group: "props", input: "image" },
      { key: "background", label: "Background color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "padding", label: "Padding", friendlyLabel: "Inner spacing", group: "style", input: "text", tokenCategory: "spacing" },
      { key: "contentWidth", label: "Content width", group: "style", input: "text" },
      {
        key: "align",
        label: "Align items (cross-axis)",
        friendlyLabel: "Alignment",
        group: "style",
        input: "select",
        options: [
          { label: "Center (default)", value: "center" },
          { label: "Start", value: "flex-start" },
          { label: "End", value: "flex-end" },
          { label: "Stretch", value: "stretch" },
        ],
      },
      { key: "gap", label: "Gap", friendlyLabel: "Space between items", group: "style", input: "text", tokenCategory: "spacing" },
      BACKGROUND_TEXTURE_FIELD,
    ],
    render(props, style, children) {
      const bgImage = str(props.backgroundImage);
      const texture = str(style.backgroundTexture) === "grain";
      // Combined as explicit multi-layer background-image (rather than the
      // `background` shorthand) so the noise texture and the bgImage's own
      // gradient+photo layer can coexist — each layer needs its own
      // matching backgroundSize/backgroundRepeat entry, comma-aligned.
      const imageLayers: string[] = [];
      const sizeLayers: string[] = [];
      const repeatLayers: string[] = [];
      if (texture) {
        imageLayers.push(`url("${NOISE_TEXTURE_DATA_URI}")`);
        sizeLayers.push("200px 200px");
        repeatLayers.push("repeat");
      }
      if (bgImage) {
        imageLayers.push("linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45))", `url(${bgImage})`);
        sizeLayers.push("cover", "cover");
        repeatLayers.push("no-repeat", "no-repeat");
      }
      const outerStyle: CSSProperties = {
        // The full-bleed breakout: spans the viewport regardless of any
        // padded/max-width-capped ancestor, without needing the page's
        // block tree to be restructured. BlockRenderer.tsx separately
        // cancels a container's top-padding gap when this is its first
        // child (see `fullBleed` on this definition).
        //
        // `--osw-bleed-width` defaults to the viewport, which is right for
        // the published page. The editor canvas is NOT the viewport — it's
        // a centered, max-width frame inside a layout with side panels —
        // so `100vw`/`-50vw` there resolve against the browser window and
        // shift the hero sideways by half the difference, which reads as a
        // background bleeding past one edge and clipped at the other
        // (docs/site-templates-plan.md). EditorClient.tsx sets the
        // variable to its own canvas width so the same breakout lands on
        // the frame instead.
        width: "var(--osw-bleed-width, 100vw)",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "calc(-0.5 * var(--osw-bleed-width, 100vw))",
        marginRight: "calc(-0.5 * var(--osw-bleed-width, 100vw))",
        boxSizing: "border-box",
        backgroundColor: bgImage ? undefined : str(style.background, "#0B1120"),
        ...(imageLayers.length
          ? { backgroundImage: imageLayers.join(", "), backgroundSize: sizeLayers.join(", "), backgroundRepeat: repeatLayers.join(", "), backgroundPosition: "center" }
          : {}),
        padding: str(style.padding, "96px 24px"),
        display: "flex",
        justifyContent: "center",
      };
      const innerStyle: CSSProperties = {
        width: "100%",
        maxWidth: str(style.contentWidth, "700px"),
        display: "flex",
        flexDirection: "column",
        alignItems: str(style.align, "center") as CSSProperties["alignItems"],
        gap: str(style.gap, "20px"),
        minHeight: "40px",
      };
      return (
        <div style={outerStyle}>
          <div style={innerStyle}>{children}</div>
        </div>
      );
    },
  },
  text: {
    label: "Text",
    defaultProps: { content: "New text block" },
    defaultStyle: { fontSize: "16px", fontWeight: "400", color: "#111111" },
    inspector: [
      { key: "content", label: "Content", friendlyLabel: "Text", group: "props", input: "textarea", bindable: true, translatable: true },
      { key: "fontSize", label: "Font size", friendlyLabel: "Text size", group: "style", input: "text", tokenCategory: "typography" },
      {
        key: "fontWeight",
        label: "Font weight",
        friendlyLabel: "Boldness",
        group: "style",
        input: "select",
        options: [
          { label: "Normal", value: "400" },
          { label: "Medium", value: "500" },
          { label: "Bold", value: "700" },
        ],
      },
      { key: "color", label: "Color", friendlyLabel: "Text color", group: "style", input: "color", tokenCategory: "colors" },
      {
        key: "textAlign",
        label: "Alignment",
        group: "style",
        input: "select",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
      },
      FONT_FIELD,
      ...OFFSET_FIELDS,
      DISPLAY_AS_BADGE_FIELD,
      BADGE_TONE_FIELD,
    ],
    render(props, style) {
      if (str(style.displayAs) === "badge") {
        const tone = BADGE_TONES[str(style.badgeTone, "neutral")] ?? BADGE_TONES.neutral;
        const badgeStyle: CSSProperties = {
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: str(style.fontSize, "13px"),
          fontWeight: str(style.fontWeight, "600") as CSSProperties["fontWeight"],
          background: tone.bg,
          color: tone.fg,
          ...fontFamilyStyle(style),
          ...offsetStyle(style),
        };
        return <span style={badgeStyle}>{str(props.content)}</span>;
      }
      const cssStyle: CSSProperties = {
        fontSize: str(style.fontSize, "16px"),
        fontWeight: str(style.fontWeight, "400") as CSSProperties["fontWeight"],
        color: str(style.color, "#111111"),
        margin: 0,
        whiteSpace: "pre-wrap",
        textAlign: (str(style.textAlign, "left") as CSSProperties["textAlign"]),
        ...fontFamilyStyle(style),
        ...offsetStyle(style),
      };
      return <p style={cssStyle}>{str(props.content)}</p>;
    },
  },
  image: {
    label: "Image",
    defaultProps: { src: "https://placehold.co/600x300", alt: "", objectFit: "cover" },
    defaultStyle: {},
    inspector: [
      { key: "src", label: "Image", group: "props", input: "image", bindable: true },
      { key: "alt", label: "Alt text", friendlyLabel: "Description (for accessibility)", group: "props", input: "text", translatable: true },
      {
        key: "objectFit",
        label: "Object fit",
        friendlyLabel: "Fit",
        group: "props",
        input: "select",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Fill", value: "fill" },
        ],
      },
      {
        // A discrete preset list (rather than only the free-text
        // `maxWidth`/`aspectRatio` fields below) so picking a size/format
        // is a one-click choice, matching how a non-technical editor
        // expects "small/medium/large" rather than typing raw CSS.
        key: "sizePreset",
        label: "Size",
        friendlyLabel: "Image size",
        group: "style",
        input: "select",
        options: [
          { label: "Full width (default)", value: "" },
          { label: "Large (75%)", value: "75%" },
          { label: "Medium (50%)", value: "50%" },
          { label: "Small (25%)", value: "25%" },
        ],
      },
      { key: "maxWidth", label: "Max width", friendlyLabel: "Custom size (overrides preset)", group: "style", input: "text" },
      {
        key: "aspectRatio",
        label: "Aspect ratio",
        friendlyLabel: "Shape",
        group: "style",
        input: "select",
        options: [
          { label: "Original (default)", value: "" },
          { label: "Square (1:1)", value: "1 / 1" },
          { label: "Landscape (16:9)", value: "16 / 9" },
          { label: "Portrait (4:5)", value: "4 / 5" },
          { label: "Wide (21:9)", value: "21 / 9" },
        ],
      },
      { key: "borderRadius", label: "Corner radius", friendlyLabel: "Rounded corners", group: "style", input: "text" },
      ...OFFSET_FIELDS,
    ],
    render(props, style) {
      const maxWidth = str(style.maxWidth) || str(style.sizePreset);
      const cssStyle: CSSProperties = {
        width: "100%",
        display: "block",
        objectFit: str(props.objectFit, "cover") as CSSProperties["objectFit"],
        borderRadius: str(style.borderRadius, "0"),
        ...(maxWidth ? { maxWidth, marginLeft: "auto", marginRight: "auto" } : {}),
        ...(str(style.aspectRatio) ? { aspectRatio: str(style.aspectRatio) } : {}),
        ...offsetStyle(style),
      };
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={str(props.src)} alt={str(props.alt)} style={cssStyle} />;
    },
  },
  button: {
    label: "Button",
    defaultProps: { label: "Click me", href: "#", variant: "primary", closesPopup: "" },
    defaultStyle: {},
    inspector: [
      { key: "label", label: "Label", friendlyLabel: "Button text", group: "props", input: "text", translatable: true },
      { key: "href", label: "Link URL", friendlyLabel: "Link", group: "props", input: "url" },
      {
        key: "variant",
        label: "Variant",
        friendlyLabel: "Style",
        group: "props",
        input: "select",
        options: [
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
        ],
      },
      {
        key: "closesPopup",
        label: "Closes popup (only has an effect inside a popup)",
        friendlyLabel: "Closes the popup when clicked",
        group: "props",
        input: "select",
        options: [
          { label: "No", value: "" },
          { label: "Yes", value: "true" },
        ],
      },
      { key: "padding", label: "Padding", friendlyLabel: "Button size", group: "style", input: "text" },
      { key: "borderRadius", label: "Corner radius", friendlyLabel: "Rounded corners", group: "style", input: "text" },
      { key: "background", label: "Background (primary)", friendlyLabel: "Button color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "color", label: "Text color (primary)", group: "style", input: "color", tokenCategory: "colors" },
      { key: "fontSize", label: "Font size", friendlyLabel: "Text size", group: "style", input: "text", tokenCategory: "typography" },
      { key: "fontWeight", label: "Font weight", friendlyLabel: "Boldness", group: "style", input: "text" },
    ],
    render(props, style) {
      const variant = str(props.variant, "primary");
      const base: CSSProperties = {
        padding: str(style.padding, "10px 18px"),
        borderRadius: str(style.borderRadius, "6px"),
        display: "inline-block",
        textDecoration: "none",
        fontSize: str(style.fontSize, "16px"),
        fontWeight: str(style.fontWeight, "500") as CSSProperties["fontWeight"],
      };
      const cssStyle: CSSProperties =
        variant === "secondary"
          ? { ...base, background: "transparent", color: str(style.color, "#111"), border: `1px solid ${str(style.color, "#111")}` }
          : {
              ...base,
              background: str(style.background, "#111"),
              color: str(style.color, "#fff"),
              border: `1px solid ${str(style.background, "#111")}`,
            };
      return (
        <a href={str(props.href, "#")} style={cssStyle} data-close-popup={str(props.closesPopup) === "true" ? "true" : undefined}>
          {str(props.label, "Button")}
        </a>
      );
    },
  },
  heading: {
    label: "Heading",
    defaultProps: { level: "h2", text: "Heading" },
    defaultStyle: { fontSize: "32px", fontWeight: "700", color: "#111111" },
    inspector: [
      { key: "text", label: "Text", friendlyLabel: "Heading text", group: "props", input: "text", translatable: true },
      {
        key: "level",
        label: "Level",
        friendlyLabel: "Importance",
        group: "props",
        input: "select",
        options: [
          { label: "H1", value: "h1" },
          { label: "H2", value: "h2" },
          { label: "H3", value: "h3" },
          { label: "H4", value: "h4" },
          { label: "H5", value: "h5" },
          { label: "H6", value: "h6" },
        ],
      },
      { key: "fontSize", label: "Font size", friendlyLabel: "Text size", group: "style", input: "text", tokenCategory: "typography" },
      { key: "color", label: "Color", friendlyLabel: "Text color", group: "style", input: "color", tokenCategory: "colors" },
      {
        key: "textAlign",
        label: "Alignment",
        group: "style",
        input: "select",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
      },
      FONT_FIELD,
    ],
    render(props, style) {
      const Tag = (["h1", "h2", "h3", "h4", "h5", "h6"].includes(str(props.level)) ? str(props.level) : "h2") as
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6";
      const cssStyle: CSSProperties = {
        fontSize: str(style.fontSize, "32px"),
        fontWeight: str(style.fontWeight, "700") as CSSProperties["fontWeight"],
        color: str(style.color, "#111111"),
        margin: 0,
        lineHeight: 1.15,
        textAlign: (str(style.textAlign, "left") as CSSProperties["textAlign"]),
        ...fontFamilyStyle(style),
      };
      return <Tag style={cssStyle}>{str(props.text, "Heading")}</Tag>;
    },
  },
  spacer: {
    label: "Spacer",
    defaultProps: {},
    defaultStyle: { height: "32px" },
    inspector: [{ key: "height", label: "Height", group: "style", input: "text", tokenCategory: "spacing" }],
    render(_props, style) {
      return <div style={{ height: str(style.height, "32px") }} />;
    },
  },
  columns: {
    label: "Columns",
    defaultProps: { columns: "2" },
    defaultStyle: { gap: "16px" },
    inspector: [
      {
        key: "columns",
        label: "Columns",
        friendlyLabel: "Number of columns",
        group: "props",
        input: "select",
        options: [
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
      },
      { key: "gap", label: "Gap", friendlyLabel: "Space between columns", group: "style", input: "text", tokenCategory: "spacing" },
    ],
    render(props, style, children, meta) {
      const desktopColumns = Number(str(props.columns, "2")) || 2;
      const cssStyle: CSSProperties = {
        display: "grid",
        // Editor accuracy: re-renders per selected breakpoint tab, so the
        // column count itself must already reflect meta.breakpoint here.
        gridTemplateColumns: `repeat(${responsiveColumnCount(desktopColumns, meta.breakpoint)}, 1fr)`,
        gap: str(style.gap, "16px"),
        minHeight: "40px",
      };
      return (
        <div style={cssStyle} data-columns-id={meta.blockId}>
          {children}
          {/* Public-renderer real-resize equivalent of the above — the
              editor never needs this since it re-renders per breakpoint
              tab instead of a live viewport resize. */}
          <style dangerouslySetInnerHTML={{ __html: columnsResponsiveCss(meta.blockId, desktopColumns) }} />
        </div>
      );
    },
  },
  embed: {
    label: "Embed",
    defaultProps: { html: "" },
    defaultStyle: { height: "300px" },
    inspector: [
      { key: "html", label: "HTML embed (sandboxed - trusted content only)", friendlyLabel: "Custom code", group: "props", input: "textarea" },
      { key: "height", label: "Height", group: "style", input: "text" },
    ],
    render(props, style) {
      return (
        <iframe
          srcDoc={str(props.html)}
          // `allow-scripts allow-same-origin` together is the same as no
          // sandbox at all: a srcDoc frame with both keeps the embedding
          // origin, so its scripts can reach `parent.document` and act as
          // the signed-in user — including in the editor canvas, where the
          // embedding origin is the dashboard. Dropping allow-same-origin
          // runs the embed in an opaque origin, which is what "sandboxed"
          // claimed here in the first place.
          sandbox="allow-scripts"
          style={{ width: "100%", height: str(style.height, "300px"), border: "0" }}
          title="Embedded content"
        />
      );
    },
  },
  // Repeating is handled directly by BlockRenderer (it needs to render the
  // child subtree once per matched CollectionItem, which a single `render`
  // call over already-built `children` can't do) — this entry only supplies
  // defaults/inspector/style for the registry-driven parts (createBlock,
  // Inspector, palette). See BlockRenderer.tsx's "list" branch.
  list: {
    label: "List / Grid",
    defaultProps: { collectionId: "", filterField: "", filterValue: "", filterTagField: "", sortField: "", sortDir: "asc", limit: "10", columns: "3" },
    defaultStyle: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
    inspector: [
      { key: "collectionId", label: "Collection", friendlyLabel: "Data source", group: "props", input: "collectionSelect" },
      { key: "filterField", label: "Filter field", friendlyLabel: "Only show items where...", group: "props", input: "text" },
      { key: "filterValue", label: "Filter value", friendlyLabel: "...equals", group: "props", input: "text" },
      { key: "sortField", label: "Sort field", friendlyLabel: "Sort by", group: "props", input: "text" },
      {
        key: "sortDir",
        label: "Sort direction",
        friendlyLabel: "Sort order",
        group: "props",
        input: "select",
        options: [
          { label: "Ascending", value: "asc" },
          { label: "Descending", value: "desc" },
        ],
      },
      { key: "limit", label: "Limit", friendlyLabel: "Max items to show", group: "props", input: "number" },
      {
        key: "columns",
        label: "Columns",
        friendlyLabel: "Number of columns",
        group: "props",
        input: "select",
        options: [
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
      },
      {
        // docs/reference-sites-plan.md Tier 5 (Mosaic's category filter bar):
        // distinct from filterField/filterValue above, which are a static
        // server-side "only show items where X equals Y" query — this
        // instead renders a client-side tag bar built from every distinct
        // value of the named field across the *matched* items, letting a
        // visitor toggle between them without a page reload. Empty (the
        // default) renders exactly as before — no filter bar at all.
        key: "filterTagField",
        label: "Client-side filter field",
        friendlyLabel: "Let visitors filter by...",
        group: "props",
        input: "text",
      },
      { key: "gap", label: "Gap", friendlyLabel: "Space between items", group: "style", input: "text", tokenCategory: "spacing" },
    ],
    // NOTE: BlockRenderer.tsx special-cases "list" (it needs to repeat the
    // child subtree once per matched CollectionItem, which this single
    // render() call over already-built `children` can't do) and never
    // actually calls this function for real content — it's kept correct
    // anyway as the registry's source of truth for the type. See
    // BlockRenderer.tsx's own "list" branch for the responsive-columns
    // logic that's actually live.
    render(props, style, children, meta) {
      const desktopColumns = Number(str(props.columns, "3")) || 3;
      const cssStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns: `repeat(${responsiveColumnCount(desktopColumns, meta.breakpoint)}, 1fr)`,
        gap: str(style.gap, "16px"),
        minHeight: "40px",
      };
      return <div style={cssStyle}>{children}</div>;
    },
  },
  // Field list/steps/onSubmit are managed by a dedicated Inspector panel
  // (components/editor/FormFieldsEditor.tsx), not the generic FieldSchema
  // loop — `inspector` stays empty on purpose (docs/forms.md).
  form: {
    label: "Form",
    defaultProps: { fields: [] as FormField[], submitLabel: "Submit", onSubmit: { action: "storeOnly" } },
    defaultStyle: { padding: "16px" },
    inspector: [],
    render(props, style, _children, meta) {
      const fields = Array.isArray(props.fields) ? (props.fields as FormField[]) : [];
      const steps = Array.isArray(props.steps) ? (props.steps as string[][]) : undefined;
      return (
        <div style={{ padding: str(style.padding, "16px") }}>
          <FormBlock
            fields={fields}
            steps={steps}
            submitLabel={str(props.submitLabel, "Submit")}
            blockId={meta.blockId}
            ctx={meta.ctx}
          />
        </div>
      );
    },
  },
  newsletter: {
    label: "Newsletter",
    defaultProps: { placeholder: "you@example.com", submitLabel: "Subscribe", successMessage: "Thanks — you're subscribed." },
    defaultStyle: { padding: "16px" },
    inspector: [
      { key: "placeholder", label: "Placeholder", friendlyLabel: "Placeholder text", group: "props", input: "text", translatable: true },
      { key: "submitLabel", label: "Submit label", friendlyLabel: "Button text", group: "props", input: "text", translatable: true },
      { key: "successMessage", label: "Success message", group: "props", input: "text", translatable: true },
      { key: "padding", label: "Padding", friendlyLabel: "Inner spacing", group: "style", input: "text", tokenCategory: "spacing" },
    ],
    render(props, style, _children, meta) {
      return (
        <div style={{ padding: str(style.padding, "16px") }}>
          <NewsletterBlock
            placeholder={str(props.placeholder, "you@example.com")}
            submitLabel={str(props.submitLabel, "Subscribe")}
            successMessage={str(props.successMessage, "Thanks — you're subscribed.")}
            blockId={meta.blockId}
            ctx={meta.ctx}
          />
        </div>
      );
    },
  },
  // docs/reference-sites-plan.md Tier 1. `items` (question/answer rows) is
  // managed by a dedicated Inspector panel (AccordionItemsEditor.tsx), not
  // the generic FieldSchema loop below — same reasoning as `form`'s
  // `fields`, except accordion's other style fields still go through the
  // normal loop (only the array prop itself is special-cased).
  accordion: {
    label: "Accordion",
    defaultProps: { items: [] as AccordionItem[], allowMultiple: "" },
    defaultStyle: { titleColor: "#111111", contentColor: "#4b5563", borderColor: "#e5e7eb", fontSize: "16px", fontWeight: "600" },
    inspector: [
      {
        key: "allowMultiple",
        label: "Allow multiple open",
        friendlyLabel: "Let several answers stay open at once",
        group: "props",
        input: "select",
        options: [
          { label: "No — opening one closes the rest", value: "" },
          { label: "Yes", value: "true" },
        ],
      },
      { key: "titleColor", label: "Question color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "contentColor", label: "Answer color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "borderColor", label: "Divider color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "fontSize", label: "Question font size", friendlyLabel: "Question text size", group: "style", input: "text", tokenCategory: "typography" },
    ],
    render(props, style) {
      const items = Array.isArray(props.items) ? (props.items as AccordionItem[]) : [];
      return <AccordionBlock items={items} allowMultiple={str(props.allowMultiple) === "true"} style={style} />;
    },
  },
  // docs/reference-sites-plan.md Tier 1. No video primitive existed before
  // this (only the iframe-based `embed` block) — self-hosted or externally
  // hosted URL, autoplay/loop/muted/poster/controls. Browsers refuse to
  // autoplay an unmuted video, so `muted` is forced on whenever `autoplay`
  // is on rather than leaving a silently-broken combination available.
  video: {
    label: "Video",
    defaultProps: { src: "", poster: "", autoplay: "", loop: "true", muted: "true", controls: "true" },
    defaultStyle: { borderRadius: "0", aspectRatio: "16 / 9" },
    inspector: [
      { key: "src", label: "Video URL", friendlyLabel: "Video file (URL)", group: "props", input: "url" },
      { key: "poster", label: "Poster image", friendlyLabel: "Preview image (optional)", group: "props", input: "image" },
      {
        key: "autoplay",
        label: "Autoplay",
        group: "props",
        input: "select",
        options: [
          { label: "No", value: "" },
          { label: "Yes (muted)", value: "true" },
        ],
      },
      {
        key: "loop",
        label: "Loop",
        group: "props",
        input: "select",
        options: [
          { label: "Yes", value: "true" },
          { label: "No", value: "" },
        ],
      },
      {
        key: "muted",
        label: "Muted",
        group: "props",
        input: "select",
        options: [
          { label: "Yes", value: "true" },
          { label: "No", value: "" },
        ],
      },
      {
        key: "controls",
        label: "Show player controls",
        group: "props",
        input: "select",
        options: [
          { label: "Yes", value: "true" },
          { label: "No", value: "" },
        ],
      },
      { key: "borderRadius", label: "Corner radius", friendlyLabel: "Rounded corners", group: "style", input: "text" },
      {
        key: "aspectRatio",
        label: "Aspect ratio",
        friendlyLabel: "Shape",
        group: "style",
        input: "select",
        options: [
          { label: "Widescreen (16:9)", value: "16 / 9" },
          { label: "Square (1:1)", value: "1 / 1" },
          { label: "Portrait (9:16)", value: "9 / 16" },
          { label: "Original", value: "" },
        ],
      },
    ],
    render(props, style) {
      const src = str(props.src);
      if (!src) {
        return (
          <div style={{ padding: "32px", textAlign: "center", background: "#f3f4f6", color: "#9ca3af", borderRadius: str(style.borderRadius, "0") }}>
            Add a video URL in the Properties panel.
          </div>
        );
      }
      const autoplay = str(props.autoplay) === "true";
      const cssStyle: CSSProperties = {
        width: "100%",
        display: "block",
        borderRadius: str(style.borderRadius, "0"),
        ...(str(style.aspectRatio) ? { aspectRatio: str(style.aspectRatio), objectFit: "cover" } : {}),
      };
      return (
        <video
          src={src}
          poster={str(props.poster) || undefined}
          autoPlay={autoplay}
          loop={str(props.loop) === "true"}
          muted={autoplay || str(props.muted) === "true"}
          controls={str(props.controls) === "true"}
          playsInline
          style={cssStyle}
        />
      );
    },
  },
  // docs/reference-sites-plan.md Tier 1: a CSS-animation-based infinite
  // marquee, reusable for testimonial/logo/stat strips alike (5/13 sites).
  // A real container (children, not flat props) so any content — text,
  // image, a saved testimonial-card block — can be looped, not just one
  // hardcoded item shape. The child sequence is rendered twice back-to-back
  // and animated exactly -50% so the loop reads as continuous; @keyframes
  // opensite-marquee-scroll is defined once globally (app/globals.css)
  // since every marquee instance shares the same 0%/-50% shape and only
  // duration/direction differ per instance.
  marquee: {
    label: "Marquee",
    defaultProps: { speed: "30", direction: "left", pauseOnHover: "true" },
    defaultStyle: { gap: "32px" },
    inspector: [
      { key: "speed", label: "Speed (seconds per loop)", friendlyLabel: "Speed", group: "props", input: "number" },
      {
        key: "direction",
        label: "Direction",
        group: "props",
        input: "select",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      {
        key: "pauseOnHover",
        label: "Pause on hover",
        group: "props",
        input: "select",
        options: [
          { label: "Yes", value: "true" },
          { label: "No", value: "" },
        ],
      },
      { key: "gap", label: "Gap", friendlyLabel: "Space between items", group: "style", input: "text", tokenCategory: "spacing" },
    ],
    render(props, style, children, meta) {
      const speed = Number(str(props.speed, "30")) || 30;
      const direction = str(props.direction, "left");
      const gap = str(style.gap, "32px");
      const pauseOnHover = str(props.pauseOnHover, "true") === "true";
      const trackStyle: CSSProperties = {
        display: "flex",
        width: "max-content",
        gap,
        animationName: "opensite-marquee-scroll",
        animationDuration: `${speed}s`,
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
        animationDirection: direction === "right" ? "reverse" : "normal",
      };
      return (
        <div style={{ overflow: "hidden" }} data-marquee-id={meta.blockId}>
          <div style={trackStyle} className="opensite-marquee-track">
            <div style={{ display: "flex", gap, flexShrink: 0 }}>{children}</div>
            <div style={{ display: "flex", gap, flexShrink: 0 }} aria-hidden>
              {children}
            </div>
          </div>
          {pauseOnHover && (
            <style
              dangerouslySetInnerHTML={{
                __html: `[data-marquee-id="${meta.blockId}"]:hover .opensite-marquee-track{animation-play-state:paused}`,
              }}
            />
          )}
        </div>
      );
    },
  },
  // docs/reference-sites-plan.md Tier 1. `tiers` is managed by a dedicated
  // Inspector panel (PricingTiersEditor.tsx), same reasoning as
  // `accordion`'s `items` above. Reuses the same responsive column-collapse
  // helpers as "columns"/"list" so tiers stack sensibly on tablet/mobile.
  pricingTable: {
    label: "Pricing Table",
    defaultProps: { tiers: [] as PricingTier[] },
    defaultStyle: { gap: "20px", accentColor: "#111111" },
    inspector: [{ key: "accentColor", label: "Accent color", friendlyLabel: "Highlight color", group: "style", input: "color", tokenCategory: "colors" }],
    render(props, style, _children, meta) {
      const tiers = Array.isArray(props.tiers) ? (props.tiers as PricingTier[]) : [];
      const accent = str(style.accentColor, "#111111");
      const desktopColumns = Math.min(tiers.length || 1, 3);
      const cssStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns: `repeat(${responsiveColumnCount(desktopColumns, meta.breakpoint)}, 1fr)`,
        gap: str(style.gap, "20px"),
        alignItems: "stretch",
      };
      if (tiers.length === 0) {
        return <p style={{ color: "#9ca3af", fontSize: "14px" }}>No pricing tiers yet — add some in the Properties panel.</p>;
      }
      return (
        <div style={cssStyle} data-columns-id={meta.blockId}>
          {tiers.map((tier) => {
            const features = tier.features.split("\n").map((f) => f.trim()).filter(Boolean);
            return (
              <div
                key={tier.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  padding: "32px 24px",
                  borderRadius: "12px",
                  border: tier.highlighted ? `2px solid ${accent}` : "1px solid #e5e7eb",
                  background: tier.highlighted ? "#fafafa" : "#ffffff",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#111111" }}>{tier.name}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "36px", fontWeight: 700, color: "#111111" }}>{tier.price}</span>
                  <span style={{ fontSize: "14px", color: "#6b7280" }}>{tier.period}</span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  {features.map((f, i) => (
                    <li key={i} style={{ fontSize: "14px", color: "#374151" }}>
                      ✓ {f}
                    </li>
                  ))}
                </ul>
                {tier.ctaLabel && (
                  <a
                    href={tier.ctaHref || "#"}
                    style={{
                      textAlign: "center",
                      padding: "10px 16px",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: "14px",
                      border: `1px solid ${accent}`,
                      background: tier.highlighted ? accent : "transparent",
                      color: tier.highlighted ? "#ffffff" : accent,
                    }}
                  >
                    {tier.ctaLabel}
                  </a>
                )}
              </div>
            );
          })}
          <style dangerouslySetInnerHTML={{ __html: columnsResponsiveCss(meta.blockId, desktopColumns) }} />
        </div>
      );
    },
  },
  // docs/reference-sites-plan.md Tier 1, seen on rareformhealth.co. One
  // stat per block instance (composed into a row via the existing
  // "columns" block, matching how "hero" composes from existing block
  // types rather than inventing a multi-item variant) — StatCounterBlock.tsx
  // handles the scroll-triggered count-up.
  statCounter: {
    label: "Stat Counter",
    defaultProps: { value: "100", prefix: "", suffix: "+", label: "Happy customers" },
    defaultStyle: { valueColor: "#111111", valueFontSize: "48px", labelColor: "#6b7280", align: "center" },
    inspector: [
      { key: "value", label: "Value", friendlyLabel: "Number to count up to", group: "props", input: "number" },
      { key: "prefix", label: "Prefix", group: "props", input: "text", translatable: true },
      { key: "suffix", label: "Suffix", group: "props", input: "text", translatable: true },
      { key: "label", label: "Label", group: "props", input: "text", translatable: true },
      { key: "valueColor", label: "Number color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "valueFontSize", label: "Number font size", group: "style", input: "text", tokenCategory: "typography" },
      { key: "labelColor", label: "Label color", group: "style", input: "color", tokenCategory: "colors" },
      {
        key: "align",
        label: "Alignment",
        group: "style",
        input: "select",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
      },
    ],
    render(props, style) {
      return (
        <StatCounterBlock
          value={str(props.value, "0")}
          prefix={str(props.prefix)}
          suffix={str(props.suffix)}
          label={str(props.label)}
          style={style}
        />
      );
    },
  },
  // docs/reference-sites-plan.md Tier 1: an image + gradient scrim +
  // positioned caption as one block, instead of manually stacking an Image
  // and an offset-positioned Text block to get the same compound look
  // (seen on Rareform's photo-card grid and GrowthSync's phone mockups).
  imageOverlay: {
    label: "Image + Caption",
    defaultProps: { src: "https://placehold.co/800x500", alt: "", caption: "Caption text" },
    defaultStyle: {
      captionPosition: "bottom",
      overlayOpacity: "0.5",
      aspectRatio: "4 / 3",
      borderRadius: "0",
      captionColor: "#ffffff",
      captionFontSize: "20px",
    },
    inspector: [
      { key: "src", label: "Image", group: "props", input: "image", bindable: true },
      { key: "alt", label: "Alt text", friendlyLabel: "Description (for accessibility)", group: "props", input: "text", translatable: true },
      { key: "caption", label: "Caption", group: "props", input: "textarea", translatable: true },
      {
        key: "captionPosition",
        label: "Caption position",
        group: "style",
        input: "select",
        options: [
          { label: "Bottom", value: "bottom" },
          { label: "Top", value: "top" },
        ],
      },
      { key: "overlayOpacity", label: "Overlay strength", friendlyLabel: "Scrim darkness (0–1)", group: "style", input: "text" },
      {
        key: "aspectRatio",
        label: "Aspect ratio",
        friendlyLabel: "Shape",
        group: "style",
        input: "select",
        options: [
          { label: "Landscape (4:3)", value: "4 / 3" },
          { label: "Square (1:1)", value: "1 / 1" },
          { label: "Portrait (4:5)", value: "4 / 5" },
          { label: "Wide (16:9)", value: "16 / 9" },
        ],
      },
      { key: "borderRadius", label: "Corner radius", friendlyLabel: "Rounded corners", group: "style", input: "text" },
      { key: "captionColor", label: "Caption color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "captionFontSize", label: "Caption font size", group: "style", input: "text", tokenCategory: "typography" },
    ],
    render(props, style) {
      const position = str(style.captionPosition, "bottom");
      const opacity = str(style.overlayOpacity, "0.5");
      return (
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: str(style.borderRadius, "0"),
            aspectRatio: str(style.aspectRatio, "4 / 3"),
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={str(props.src)}
            alt={str(props.alt)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: position === "top" ? "flex-start" : "flex-end",
              padding: "24px",
              background: `linear-gradient(to ${position === "top" ? "bottom" : "top"}, rgba(0,0,0,${opacity}), transparent 60%)`,
            }}
          >
            <p style={{ margin: 0, color: str(style.captionColor, "#ffffff"), fontSize: str(style.captionFontSize, "20px"), fontWeight: 600 }}>
              {str(props.caption)}
            </p>
          </div>
        </div>
      );
    },
  },
  // docs/reference-sites-plan.md Tier 2. `items` is managed by a dedicated
  // Inspector panel (ContentSwitcherItemsEditor.tsx), same reasoning as
  // `accordion`'s `items` — the actual click/hover-swap interaction lives
  // in ContentSwitcherBlock.tsx as self-contained client state.
  contentSwitcher: {
    label: "Content Switcher",
    defaultProps: { items: [] as ContentSwitcherItem[] },
    defaultStyle: { activeColor: "#111111", inactiveColor: "#9ca3af", gap: "32px", imageAspectRatio: "4 / 5" },
    inspector: [
      { key: "activeColor", label: "Active label color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "inactiveColor", label: "Inactive label color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "gap", label: "Gap", friendlyLabel: "Space between list and image", group: "style", input: "text", tokenCategory: "spacing" },
      {
        key: "imageAspectRatio",
        label: "Image aspect ratio",
        friendlyLabel: "Image shape",
        group: "style",
        input: "select",
        options: [
          { label: "Portrait (4:5)", value: "4 / 5" },
          { label: "Square (1:1)", value: "1 / 1" },
          { label: "Landscape (4:3)", value: "4 / 3" },
        ],
      },
    ],
    render(props, style) {
      const items = Array.isArray(props.items) ? (props.items as ContentSwitcherItem[]) : [];
      return <ContentSwitcherBlock items={items} style={style} />;
    },
  },
  // docs/reference-sites-plan.md Tier 2, seen on wishlabs.ai's product
  // spotlight. Self-contained interactive component — see
  // BeforeAfterBlock.tsx for the drag/clip-path mechanics.
  beforeAfter: {
    label: "Before/After Slider",
    defaultProps: {
      beforeSrc: "https://placehold.co/800x500/94a3b8/ffffff?text=Before",
      afterSrc: "https://placehold.co/800x500/1e293b/ffffff?text=After",
      beforeLabel: "Before",
      afterLabel: "After",
    },
    defaultStyle: { aspectRatio: "16 / 9", borderRadius: "0", handleColor: "#ffffff" },
    inspector: [
      { key: "beforeSrc", label: "Before image", group: "props", input: "image", bindable: true },
      { key: "afterSrc", label: "After image", group: "props", input: "image", bindable: true },
      { key: "beforeLabel", label: "Before label", group: "props", input: "text", translatable: true },
      { key: "afterLabel", label: "After label", group: "props", input: "text", translatable: true },
      {
        key: "aspectRatio",
        label: "Aspect ratio",
        friendlyLabel: "Shape",
        group: "style",
        input: "select",
        options: [
          { label: "Widescreen (16:9)", value: "16 / 9" },
          { label: "Landscape (4:3)", value: "4 / 3" },
          { label: "Square (1:1)", value: "1 / 1" },
        ],
      },
      { key: "borderRadius", label: "Corner radius", friendlyLabel: "Rounded corners", group: "style", input: "text" },
      { key: "handleColor", label: "Handle color", group: "style", input: "color", tokenCategory: "colors" },
    ],
    render(props, style) {
      return (
        <BeforeAfterBlock
          beforeSrc={str(props.beforeSrc)}
          afterSrc={str(props.afterSrc)}
          beforeLabel={str(props.beforeLabel, "Before")}
          afterLabel={str(props.afterLabel, "After")}
          style={style}
        />
      );
    },
  },
  // docs/reference-sites-plan.md Tier 2 (Rareform's Rareform-vs-Traditional
  // Care-vs-Diagnostics table, middle column visually elevated). `columns`
  // and `rows` are managed together by a dedicated Inspector panel
  // (ComparisonTableEditor.tsx) since a row's `cells` must stay
  // positionally aligned with `columns`.
  comparisonTable: {
    label: "Comparison Table",
    defaultProps: { columns: [] as ComparisonColumn[], rows: [] as ComparisonRow[] },
    defaultStyle: { accentColor: "#111111", headerColor: "#111111", labelColor: "#374151" },
    inspector: [
      { key: "accentColor", label: "Accent color", friendlyLabel: "Highlight color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "headerColor", label: "Header text color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "labelColor", label: "Row label color", group: "style", input: "color", tokenCategory: "colors" },
    ],
    render(props, style) {
      const columns = Array.isArray(props.columns) ? (props.columns as ComparisonColumn[]) : [];
      const rows = Array.isArray(props.rows) ? (props.rows as ComparisonRow[]) : [];
      if (columns.length === 0) {
        return <p style={{ color: "#9ca3af", fontSize: "14px" }}>No columns yet — add some in the Properties panel.</p>;
      }
      const accent = str(style.accentColor, "#111111");
      return (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${(columns.length + 1) * 140}px` }}>
            <thead>
              <tr>
                <th style={{ padding: "12px 16px" }} />
                {columns.map((col) => (
                  <th
                    key={col.id}
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      fontSize: "15px",
                      fontWeight: 700,
                      background: col.highlighted ? accent : "transparent",
                      color: col.highlighted ? "#ffffff" : str(style.headerColor, "#111111"),
                      borderRadius: col.highlighted ? "8px 8px 0 0" : undefined,
                    }}
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: str(style.labelColor, "#374151"), borderBottom: "1px solid #e5e7eb" }}>
                    {row.label}
                  </td>
                  {columns.map((col, i) => (
                    <td
                      key={col.id}
                      style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        fontSize: "14px",
                        borderBottom: "1px solid #e5e7eb",
                        background: col.highlighted ? "#fafafa" : undefined,
                      }}
                    >
                      {renderComparisonCell(row.cells[i] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
  },
  // docs/starter-templates.md's Aperture port of Gallery.tsx. `images` is
  // managed by a dedicated Inspector panel (BlockImagesEditor.tsx), same
  // reasoning as AccordionItem/ContentSwitcherItem — `inspector` only
  // covers the flat `columns` prop + style. Simplifications from the
  // source (both noted in the doc): no lightbox (the source's Lightbox is
  // a separate component with keyboard nav — dropped entirely, images
  // aren't clickable), and captions render as an always-visible
  // `<figcaption>` bar rather than a hover overlay (inline styles can't do
  // `:hover`). Column collapsing at tablet/mobile widths reuses the same
  // columnsResponsiveCss the "columns"/"list" blocks already use, rather
  // than the source's bespoke `columnClasses` breakpoint map.
  gallery: {
    label: "Gallery",
    defaultProps: { images: [] as BlockImage[], columns: "3" },
    defaultStyle: { gap: "12px" },
    inspector: [
      {
        key: "columns",
        label: "Columns",
        friendlyLabel: "Number of columns",
        group: "props",
        input: "select",
        options: [
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
      },
      { key: "gap", label: "Gap", friendlyLabel: "Space between images", group: "style", input: "text", tokenCategory: "spacing" },
    ],
    render(props, style, _children, meta) {
      const images = Array.isArray(props.images) ? (props.images as BlockImage[]) : [];
      const desktopColumns = Number(str(props.columns, "3")) || 3;
      if (images.length === 0) {
        return <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>No images yet — add some in the Properties panel.</p>;
      }
      const cssStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns: `repeat(${responsiveColumnCount(desktopColumns, meta.breakpoint)}, 1fr)`,
        gap: str(style.gap, "12px"),
      };
      return (
        <div style={cssStyle} data-columns-id={meta.blockId}>
          {images.map((image) => (
            <figure key={image.id} style={{ margin: 0 }}>
              <div style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden", borderRadius: "8px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt={image.alt}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } as CSSProperties}
                />
              </div>
              {image.caption && (
                <figcaption style={{ marginTop: "6px", fontSize: "13px", color: "#6b7280" }}>{image.caption}</figcaption>
              )}
            </figure>
          ))}
          <style dangerouslySetInnerHTML={{ __html: columnsResponsiveCss(meta.blockId, desktopColumns) }} />
        </div>
      );
    },
  },
  // docs/starter-templates.md's Aperture port of Slider.tsx — see
  // SliderBlock.tsx for the controlled-index track (simplified from the
  // source's native scroll-snap + IntersectionObserver dot-sync, per the
  // doc's "What we simplified" section). `images` shares the same
  // BlockImagesEditor Inspector panel as `gallery`.
  slider: {
    label: "Slider",
    defaultProps: { images: [] as BlockImage[] },
    defaultStyle: { aspectRatio: "16 / 10", borderRadius: "12px" },
    inspector: [
      {
        key: "aspectRatio",
        label: "Aspect ratio",
        friendlyLabel: "Shape",
        group: "style",
        input: "select",
        options: [
          { label: "Widescreen (16:10)", value: "16 / 10" },
          { label: "Landscape (16:9)", value: "16 / 9" },
          { label: "Square (1:1)", value: "1 / 1" },
        ],
      },
      { key: "borderRadius", label: "Corner radius", friendlyLabel: "Rounded corners", group: "style", input: "text" },
    ],
    render(props, style) {
      const images = Array.isArray(props.images) ? (props.images as BlockImage[]) : [];
      return <SliderBlock images={images} style={style} />;
    },
  },
};

for (const [type, def] of Object.entries(builtinBlocks)) {
  // "form"'s inspector array is never read by the generic Inspector.tsx
  // loop (a dedicated FormFieldsEditor handles it instead — see the
  // comment above the `form` entry above), so appending here would be a
  // no-op there; skipped to avoid a misleading dead field.
  const inspector =
    type === "form" ? def.inspector : [...def.inspector, ANIMATION_FIELD, ANIMATION_MODE_FIELD, STICKY_FIELD, STICKY_OFFSET_FIELD];
  registerBlock<RenderContext>({ type, ...def, inspector });
}

// Re-exported (rather than imported piecemeal elsewhere) so importing
// "./registry" is what guarantees the `registerBlock` calls above have
// run — anything that looks up a block definition should go through
// these, not import @opensite/block-sdk's registry functions directly,
// so it can't accidentally run before the built-ins are registered.
export { getBlockDefinition, getAllBlockDefinitions };

// The hero's starting composition (docs/ui-ux-roadmap.md: "full control
// of the content inside the hero section") — real child blocks, not
// flat props, so a user can freely edit/remove/reorder/add to any of
// this exactly like any other container's children. Only applied once,
// at creation time, in createBlock below; an empty hero (all children
// deleted) stays empty rather than being re-seeded.
function heroDefaultChildren(): Block[] {
  return [
    {
      id: crypto.randomUUID(),
      type: "text",
      props: { content: "EYEBROW TEXT" },
      style: { base: { fontSize: "13px", fontWeight: "700", color: "#F59E0B", textAlign: "center" } },
    },
    {
      id: crypto.randomUUID(),
      type: "heading",
      props: { text: "Your headline here", level: "h1" },
      style: { base: { fontSize: "56px", fontWeight: "700", color: "#F8FAFC", textAlign: "center" } },
    },
    {
      id: crypto.randomUUID(),
      type: "text",
      props: { content: "A short sentence that supports the headline above." },
      style: { base: { fontSize: "19px", fontWeight: "400", color: "#94A3B8", textAlign: "center" } },
    },
    {
      id: crypto.randomUUID(),
      type: "button",
      props: { label: "Get started", href: "#", variant: "primary" },
      style: { base: { padding: "14px 28px", borderRadius: "8px", fontSize: "16px", fontWeight: "600", background: "#F59E0B", color: "#0B1120" } },
    },
  ];
}

export function createBlock(type: string): Block {
  const def = getBlockDefinition<RenderContext>(type);
  if (!def) throw new Error(`createBlock: no block registered for type "${type}"`);
  return {
    id: crypto.randomUUID(),
    type,
    props: { ...def.defaultProps },
    style: { base: { ...def.defaultStyle } },
    children: type === "hero" ? heroDefaultChildren() : hasContainerChildren(type) ? [] : undefined,
  };
}
