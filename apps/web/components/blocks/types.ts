export type BlockType =
  | "section"
  | "text"
  | "image"
  | "button"
  | "heading"
  | "spacer"
  | "columns"
  | "embed";

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
};

export type PageContent = {
  root: Block;
  version: number;
};

export type FieldSchema = {
  key: string;
  label: string;
  group: "props" | "style";
  input: "text" | "textarea" | "number" | "color" | "select" | "url" | "image";
  options?: { label: string; value: string }[];
};
