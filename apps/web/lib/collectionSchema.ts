// A Collection's fieldSchema is an array of these — the field types listed
// in docs/collections.md's "Core concept" section. Kept intentionally flat
// (no nested/repeating fields) matching the project's minimal-scope pattern.
export type CollectionField = {
  key: string;
  label: string;
  type: "text" | "richText" | "number" | "boolean" | "date" | "image" | "reference";
  referenceCollectionId?: string;
};
