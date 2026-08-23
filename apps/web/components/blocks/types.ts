import type { Condition } from "@/lib/condition";

export type BlockType =
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

export type Breakpoint = "base" | "tablet" | "mobile";

// `base` holds the desktop/default values (always present once a block is
// created); `tablet`/`mobile` hold sparse overrides only for the props that
// differ at that breakpoint. See lib/responsiveStyle.ts for how these merge.
export type BlockStyle = Partial<Record<Breakpoint, Record<string, unknown>>>;

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

export type FieldSchema = {
  key: string;
  label: string;
  group: "props" | "style";
  input: "text" | "textarea" | "number" | "color" | "select" | "url" | "image" | "collectionSelect";
  options?: { label: string; value: string }[];
  // Props fields only: whether the Inspector should offer a "bind to
  // collection field" toggle alongside the literal-value input.
  bindable?: boolean;
  // Props fields only: whether this is a "text-bearing" field that can
  // carry a per-locale Translation override (docs/multilingual.md) — text
  // content, image alt text, button labels, etc. Drives both the
  // Inspector's locale-aware read/write (components/editor/Inspector.tsx)
  // and BlockRenderer's resolveTranslatedProps (lib/translations.ts).
  // Structural/config fields (layout, href, variant, collection query
  // params, ...) are never translatable — they always edit the base block
  // regardless of selected locale.
  translatable?: boolean;
  // Style fields only: which Theme token category this field may bind to
  // (see lib/theme.ts) instead of a literal value.
  tokenCategory?: "colors" | "typography" | "spacing";
};
