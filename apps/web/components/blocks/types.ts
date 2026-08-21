export type BlockType = "section" | "text" | "image" | "button";

export type Block = {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  style?: Record<string, unknown>;
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
  input: "text" | "textarea" | "number" | "color" | "select" | "url";
  options?: { label: string; value: string }[];
};
