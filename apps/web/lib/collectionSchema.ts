// A Collection's fieldSchema is an array of these — the field types listed
// in docs/collections.md's "Core concept" section. Kept intentionally flat
// (no nested/repeating fields) matching the project's minimal-scope pattern.
export type CollectionField = {
  key: string;
  label: string;
  type: "text" | "richText" | "number" | "boolean" | "date" | "image" | "reference";
  referenceCollectionId?: string;
  // docs/multilingual.md: a translatable field gets a Translation row per
  // locale (entityType `collectionItem`, entityId the CollectionItem's id,
  // field this key); non-translatable fields (a price, a date, ...) stay
  // shared across every locale by definition — resolved via the same
  // shared lib/bind.ts `resolveBind` -> lib/translations.ts path every
  // other $bind read goes through.
  translatable?: boolean;
};
