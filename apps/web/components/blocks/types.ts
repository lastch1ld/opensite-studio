import type { Condition } from "@/lib/condition";
import type { Breakpoint, BlockStyle, FieldSchema } from "@opensite/block-sdk";

// `Breakpoint`/`BlockStyle`/`FieldSchema` moved to @opensite/block-sdk as
// part of the Block SDK extraction (docs/plugin-sdk.md) — re-exported here
// so existing imports of `./types` keep working unchanged. `base` holds
// the desktop/default style values (always present once a block is
// created); `tablet`/`mobile` hold sparse overrides only for the props
// that differ at that breakpoint. See lib/responsiveStyle.ts for how
// these merge.
export type { Breakpoint, BlockStyle, FieldSchema };

// The block types opensite-studio ships with out of the box. `Block.type`
// itself (below) is the wider `string`, not this union — plugins register
// additional types at runtime (docs/plugin-sdk.md) via
// @opensite/block-sdk's `registerBlock`, and the block tree has to be able
// to hold whatever a site actually uses, built-in or plugin-authored.
export type BuiltinBlockType =
  | "section"
  | "text"
  | "image"
  | "button"
  | "heading"
  | "spacer"
  | "columns"
  | "embed"
  | "list"
  | "form"
  | "newsletter";

export type BlockType = string;

export type Block = {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  style?: BlockStyle;
  children?: Block[];
  // A block whose condition evaluates false at render time doesn't render
  // at all (see lib/condition.ts). Independent of style/props.
  condition?: Condition;
};

export type PageContent = {
  root: Block;
  version: number;
};

// docs/forms.md's `form` block props. `fields` render as actual input
// widgets (managed via a dedicated Inspector panel, not the generic
// FieldSchema-driven one, since it's a list of structured records rather
// than flat props) — see components/editor/FormFieldsEditor.tsx.
export type FormField = {
  id: string;
  type: "text" | "email" | "textarea" | "select" | "checkbox" | "radio" | "file";
  label: string;
  required: boolean;
  options?: string[];
  showIf?: Condition;
};

export type FormOnSubmit =
  | { action: "storeOnly" }
  | { action: "webhook"; url: string }
  | { action: "email"; to: string };

export type FormBlockProps = {
  fields: FormField[];
  steps?: string[][];
  submitLabel: string;
  onSubmit: FormOnSubmit;
};

// docs/integrations.md's "newsletter" block: just an email input + submit —
// provider config (webhook URL vs. storeOnly) lives site-wide in
// SiteSettings.newsletter (lib/siteSettings.ts), not per-block, since it's
// the same provider for every newsletter block on a site.
export type NewsletterBlockProps = {
  placeholder: string;
  submitLabel: string;
  successMessage: string;
};
