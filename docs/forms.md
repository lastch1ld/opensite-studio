# Forms

Not part of Phase 0/1. Expands on data-model.md's `FormSubmission` stub
and roadmap.md's Phase 3 "Forms block + submissions" one-liner — research
against Elementor's form builder showed that's meaningfully underspecified
on its own, so it gets its own doc.

## Core concept

A `form` block type (blocks-and-theming.md's block set) whose `props`
define a list of fields (label, type, required, options-for-select/radio,
validation) and whose children render the actual input widgets — same
container-with-children pattern as `section`/`columns`, not a monolithic
opaque widget, so individual fields stay editable/reorderable like any
other block content.

```ts
type FormField = {
  id: string;
  type: "text" | "email" | "textarea" | "select" | "checkbox" | "radio" | "file";
  label: string;
  required: boolean;
  options?: string[]; // select/radio
  showIf?: Condition;  // conditional field, reuses collections.md's Condition type
};

type FormBlockProps = {
  fields: FormField[];
  steps?: string[][];       // field-id groups, for multi-step forms; omitted = single-step
  submitLabel: string;
  onSubmit: { action: "storeOnly" } | { action: "webhook"; url: string } | { action: "email"; to: string };
};
```

## Submission handling

- Every submission is persisted via `FormSubmission` (data-model.md: id,
  pageId, blockId, data Json, createdAt) regardless of `onSubmit.action` —
  local storage is the always-on fallback/audit trail, matching
  integrations.md's newsletter-block design (local log + provider push,
  not provider-only).
- `onSubmit.action` determines what *else* happens: forward to a webhook
  URL, send a notification email, or (`storeOnly`) nothing further —
  covers the common "just email me the submissions" case without needing
  a provider integration.
- **Conditional fields** (`FormField.showIf`) reuse collections.md's
  `Condition` type rather than a form-specific rules dialect — e.g. show a
  "company name" field only if a "type of inquiry" select equals
  "business."
- **Multi-step forms** are a client-side presentation concern
  (`steps` groups which fields show together, with next/back navigation)
  over the same single field list and single submission record — not a
  sequence of separate forms.
- **File uploads** as a field type reuse the media pipeline (media.md) for
  storage, but store submitted files under the submission rather than the
  site's general media library (they're user-submitted content, not
  site-authored assets — keep that distinction rather than mixing them
  into the same picker).

## Rate limiting & spam

Public-facing forms are an abuse surface (same class of concern as
ai-mode.md's chat proxy): basic rate limiting per IP/site on the submit
endpoint, plus an obvious extension point for a CAPTCHA/honeypot field
later — not required for the first working version, but the submit API
route should be structured so adding it isn't a rewrite.

## Editor UX implications

- Field list managed via the Inspector (editor.md) when a `form` block is
  selected — add/remove/reorder fields, edit each field's config,
  including its `showIf` condition through the same condition-builder UI
  used elsewhere (theme-builder.md's targeting, popups-and-modals.md's
  conditional trigger).
- A "Submissions" tab per form/page in the dashboard to browse/export
  stored `FormSubmission` rows (basic table view, CSV export) — not a
  full reporting/analytics dashboard, which is explicitly out of scope for
  this project.
