import type { CSSProperties } from "react";
import { registerBlock, getBlockDefinition, getAllBlockDefinitions } from "@opensite/block-sdk";
import type { BlockDefinition } from "@opensite/block-sdk";
import type { Block, FormField } from "./types";
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

const builtinBlocks: Record<string, Omit<AppBlockDef, "type">> = {
  section: {
    label: "Section",
    defaultProps: { layout: "stack" },
    defaultStyle: { padding: "24px", background: "#ffffff" },
    inspector: [
      {
        key: "layout",
        label: "Layout",
        group: "props",
        input: "select",
        options: [
          { label: "Stack (vertical)", value: "stack" },
          { label: "Row (horizontal)", value: "row" },
        ],
      },
      { key: "padding", label: "Padding", group: "style", input: "text", tokenCategory: "spacing" },
      { key: "background", label: "Background", group: "style", input: "color", tokenCategory: "colors" },
    ],
    render(props, style, children) {
      const layout = str(props.layout, "stack");
      const cssStyle: CSSProperties = {
        padding: str(style.padding, "24px"),
        background: str(style.background, "#ffffff"),
        display: "flex",
        flexDirection: layout === "row" ? "row" : "column",
        gap: "12px",
        minHeight: "40px",
      };
      return <div style={cssStyle}>{children}</div>;
    },
  },
  text: {
    label: "Text",
    defaultProps: { content: "New text block" },
    defaultStyle: { fontSize: "16px", fontWeight: "400", color: "#111111" },
    inspector: [
      { key: "content", label: "Content", group: "props", input: "textarea", bindable: true },
      { key: "fontSize", label: "Font size", group: "style", input: "text", tokenCategory: "typography" },
      {
        key: "fontWeight",
        label: "Font weight",
        group: "style",
        input: "select",
        options: [
          { label: "Normal", value: "400" },
          { label: "Medium", value: "500" },
          { label: "Bold", value: "700" },
        ],
      },
      { key: "color", label: "Color", group: "style", input: "color", tokenCategory: "colors" },
    ],
    render(props, style) {
      const cssStyle: CSSProperties = {
        fontSize: str(style.fontSize, "16px"),
        fontWeight: str(style.fontWeight, "400") as CSSProperties["fontWeight"],
        color: str(style.color, "#111111"),
        margin: 0,
        whiteSpace: "pre-wrap",
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
      { key: "alt", label: "Alt text", group: "props", input: "text" },
      {
        key: "objectFit",
        label: "Object fit",
        group: "props",
        input: "select",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Fill", value: "fill" },
        ],
      },
    ],
    render(props) {
      const cssStyle: CSSProperties = {
        width: "100%",
        objectFit: str(props.objectFit, "cover") as CSSProperties["objectFit"],
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
      { key: "label", label: "Label", group: "props", input: "text" },
      { key: "href", label: "Link URL", group: "props", input: "url" },
      {
        key: "variant",
        label: "Variant",
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
        group: "props",
        input: "select",
        options: [
          { label: "No", value: "" },
          { label: "Yes", value: "true" },
        ],
      },
    ],
    render(props) {
      const variant = str(props.variant, "primary");
      const cssStyle: CSSProperties =
        variant === "secondary"
          ? { padding: "10px 18px", borderRadius: "6px", background: "transparent", color: "#111", border: "1px solid #111", display: "inline-block", textDecoration: "none" }
          : { padding: "10px 18px", borderRadius: "6px", background: "#111", color: "#fff", border: "1px solid #111", display: "inline-block", textDecoration: "none" };
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
      { key: "text", label: "Text", group: "props", input: "text" },
      {
        key: "level",
        label: "Level",
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
      { key: "fontSize", label: "Font size", group: "style", input: "text", tokenCategory: "typography" },
      { key: "color", label: "Color", group: "style", input: "color", tokenCategory: "colors" },
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
        group: "props",
        input: "select",
        options: [
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
      },
      { key: "gap", label: "Gap", group: "style", input: "text", tokenCategory: "spacing" },
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
      { key: "html", label: "HTML embed (sandboxed - trusted content only)", group: "props", input: "textarea" },
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
      { key: "collectionId", label: "Collection", group: "props", input: "collectionSelect" },
      { key: "filterField", label: "Filter field", group: "props", input: "text" },
      { key: "filterValue", label: "Filter value", group: "props", input: "text" },
      { key: "sortField", label: "Sort field", group: "props", input: "text" },
      {
        key: "sortDir",
        label: "Sort direction",
        group: "props",
        input: "select",
        options: [
          { label: "Ascending", value: "asc" },
          { label: "Descending", value: "desc" },
        ],
      },
      { key: "limit", label: "Limit", group: "props", input: "number" },
      { key: "gap", label: "Gap", group: "style", input: "text", tokenCategory: "spacing" },
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
      { key: "placeholder", label: "Placeholder", group: "props", input: "text" },
      { key: "submitLabel", label: "Submit label", group: "props", input: "text" },
      { key: "successMessage", label: "Success message", group: "props", input: "text" },
      { key: "padding", label: "Padding", group: "style", input: "text", tokenCategory: "spacing" },
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
  registerBlock<RenderContext>({ type, ...def });
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
