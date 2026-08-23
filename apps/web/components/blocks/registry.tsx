import type { CSSProperties } from "react";
import { registerBlock, getBlockDefinition, getAllBlockDefinitions } from "@opensite/block-sdk";
import type { BlockDefinition } from "@opensite/block-sdk";
import type { Block, FieldSchema, FormField } from "./types";
import { hasContainerChildren } from "@/lib/responsiveStyle";
import { FormBlock } from "./FormBlock";
import { NewsletterBlock } from "./NewsletterBlock";
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
    ],
    render(props, style, children) {
      const layout = str(props.layout, "stack");
      const maxWidth = str(style.maxWidth);
      const align = str(style.align);
      const justify = str(style.justify);
      const cssStyle: CSSProperties = {
        padding: str(style.padding, "24px"),
        background: str(style.background, "#ffffff"),
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
  hero: {
    label: "Hero",
    defaultProps: {
      eyebrow: "",
      heading: "Your headline here",
      subheading: "A short sentence that supports the headline above.",
      buttonLabel: "Get started",
      buttonHref: "#",
      backgroundImage: "",
    },
    defaultStyle: { background: "#0B1120", color: "#ffffff", padding: "96px 24px", contentWidth: "700px" },
    inspector: [
      { key: "eyebrow", label: "Eyebrow", friendlyLabel: "Small label above the headline", group: "props", input: "text", translatable: true },
      { key: "heading", label: "Heading", group: "props", input: "text", translatable: true },
      { key: "subheading", label: "Subheading", group: "props", input: "textarea", translatable: true },
      { key: "buttonLabel", label: "Button text", group: "props", input: "text", translatable: true },
      { key: "buttonHref", label: "Button link", group: "props", input: "url" },
      { key: "backgroundImage", label: "Background image", friendlyLabel: "Background image (optional)", group: "props", input: "image" },
      { key: "background", label: "Background color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "color", label: "Text color", group: "style", input: "color", tokenCategory: "colors" },
      { key: "padding", label: "Padding", friendlyLabel: "Inner spacing", group: "style", input: "text", tokenCategory: "spacing" },
      { key: "contentWidth", label: "Content width", group: "style", input: "text" },
    ],
    render(props, style) {
      const bgImage = str(props.backgroundImage);
      const outerStyle: CSSProperties = {
        // The full-bleed breakout: spans the viewport regardless of any
        // padded/max-width-capped ancestor, without needing the page's
        // block tree to be restructured.
        width: "100vw",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        boxSizing: "border-box",
        background: bgImage
          ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url(${bgImage}) center/cover no-repeat`
          : str(style.background, "#0B1120"),
        color: str(style.color, "#ffffff"),
        padding: str(style.padding, "96px 24px"),
        display: "flex",
        justifyContent: "center",
      };
      const innerStyle: CSSProperties = {
        width: "100%",
        maxWidth: str(style.contentWidth, "700px"),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        textAlign: "center",
      };
      const eyebrow = str(props.eyebrow);
      return (
        <div style={outerStyle}>
          <div style={innerStyle}>
            {eyebrow && <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em", opacity: 0.75 }}>{eyebrow}</span>}
            <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700, lineHeight: 1.15 }}>{str(props.heading, "Your headline here")}</h1>
            {str(props.subheading) && <p style={{ margin: 0, fontSize: "19px", opacity: 0.85 }}>{str(props.subheading)}</p>}
            {str(props.buttonLabel) && (
              <a
                href={str(props.buttonHref, "#")}
                style={{
                  marginTop: "8px",
                  padding: "14px 28px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  textDecoration: "none",
                  background: "#F59E0B",
                  color: "#0B1120",
                }}
              >
                {str(props.buttonLabel)}
              </a>
            )}
          </div>
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
      ...OFFSET_FIELDS,
    ],
    render(props, style) {
      const cssStyle: CSSProperties = {
        fontSize: str(style.fontSize, "16px"),
        fontWeight: str(style.fontWeight, "400") as CSSProperties["fontWeight"],
        color: str(style.color, "#111111"),
        margin: 0,
        whiteSpace: "pre-wrap",
        textAlign: (str(style.textAlign, "left") as CSSProperties["textAlign"]),
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
      { key: "borderRadius", label: "Corner radius", friendlyLabel: "Rounded corners", group: "style", input: "text" },
      ...OFFSET_FIELDS,
    ],
    render(props, style) {
      const cssStyle: CSSProperties = {
        width: "100%",
        display: "block",
        objectFit: str(props.objectFit, "cover") as CSSProperties["objectFit"],
        borderRadius: str(style.borderRadius, "0"),
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
    render(props, style, children) {
      const columns = str(props.columns, "2");
      const cssStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: str(style.gap, "16px"),
        minHeight: "40px",
      };
      return <div style={cssStyle}>{children}</div>;
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
          sandbox="allow-scripts allow-same-origin"
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
    defaultProps: { collectionId: "", filterField: "", filterValue: "", sortField: "", sortDir: "asc", limit: "10" },
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
      { key: "gap", label: "Gap", friendlyLabel: "Space between items", group: "style", input: "text", tokenCategory: "spacing" },
    ],
    render(props, style, children) {
      const cssStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
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
};

for (const [type, def] of Object.entries(builtinBlocks)) {
  // "form"'s inspector array is never read by the generic Inspector.tsx
  // loop (a dedicated FormFieldsEditor handles it instead — see the
  // comment above the `form` entry above), so appending here would be a
  // no-op there; skipped to avoid a misleading dead field.
  const inspector = type === "form" ? def.inspector : [...def.inspector, ANIMATION_FIELD];
  registerBlock<RenderContext>({ type, ...def, inspector });
}

// Re-exported (rather than imported piecemeal elsewhere) so importing
// "./registry" is what guarantees the `registerBlock` calls above have
// run — anything that looks up a block definition should go through
// these, not import @opensite/block-sdk's registry functions directly,
// so it can't accidentally run before the built-ins are registered.
export { getBlockDefinition, getAllBlockDefinitions };

export function createBlock(type: string): Block {
  const def = getBlockDefinition<RenderContext>(type);
  if (!def) throw new Error(`createBlock: no block registered for type "${type}"`);
  return {
    id: crypto.randomUUID(),
    type,
    props: { ...def.defaultProps },
    style: { base: { ...def.defaultStyle } },
    children: hasContainerChildren(type) ? [] : undefined,
  };
}
