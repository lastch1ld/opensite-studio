import type { Block, PageContent } from "@/components/blocks/types";

// "Describe your business, get a site" — the feature every hosted builder
// leads with in 2026 and the clearest reason to pick this over a static
// template gallery.
//
// The model does NOT emit a block tree. Asking an LLM for structured page
// JSON produces invalid trees, unregistered block types and broken
// bindings often enough that the failure mode is a broken site, and this
// project already has six hand-built, contrast-audited genre templates
// (docs/site-templates-plan.md). So the structure comes from a template
// and the model only writes the copy that fills it: it cannot produce
// anything the block system can't render, and the result inherits the
// accessibility and design work already done.
//
// Placeholder-driven: every template ships copy like "Replace with a
// features-page headline", which is both the slot marker and a
// description of what belongs there — a prompt written for a human that
// happens to work on a model.

export type TextSlot = {
  /** `<pageSlug>:<blockId>:<field>` — stable across the request/response round trip. */
  id: string;
  /** The placeholder text, which doubles as the instruction for what belongs here. */
  current: string;
  /** Roughly how long the replacement should be, inferred from the slot. */
  kind: "heading" | "body" | "label";
};

const TEXT_FIELDS: Record<string, { field: string; kind: TextSlot["kind"] }[]> = {
  heading: [{ field: "text", kind: "heading" }],
  text: [{ field: "content", kind: "body" }],
  button: [{ field: "label", kind: "label" }],
};

/** True for the placeholder copy the templates ship — the only text generation is allowed to touch. */
export function isPlaceholder(value: unknown): value is string {
  return typeof value === "string" && /^(replace with|your site name|your name)/i.test(value.trim());
}

export function collectTextSlots(content: PageContent, pageSlug: string): TextSlot[] {
  const slots: TextSlot[] = [];
  const visit = (block: Block) => {
    for (const { field, kind } of TEXT_FIELDS[block.type] ?? []) {
      const value = (block.props ?? {})[field];
      if (isPlaceholder(value)) slots.push({ id: `${pageSlug}:${block.id}:${field}`, current: value, kind });
    }
    (block.children ?? []).forEach(visit);
  };
  visit(content.root);
  return slots;
}

/**
 * Writes generated copy back into a page. Only slots that were collected
 * from this page are applied, and only over text that is still a
 * placeholder — a generation that arrives after someone started editing
 * must not overwrite their words.
 */
export function applyTextSlots(content: PageContent, pageSlug: string, values: Record<string, string>): PageContent {
  const rewrite = (block: Block): Block => {
    let props = block.props;
    for (const { field } of TEXT_FIELDS[block.type] ?? []) {
      const value = values[`${pageSlug}:${block.id}:${field}`];
      if (typeof value === "string" && value.trim() && isPlaceholder((props ?? {})[field])) {
        props = { ...props, [field]: value.trim() };
      }
    }
    return { ...block, props, children: block.children?.map(rewrite) };
  };
  return { ...content, root: rewrite(content.root) };
}

const LENGTH_GUIDE: Record<TextSlot["kind"], string> = {
  heading: "at most 10 words, no trailing period",
  body: "one or two sentences",
  label: "at most 4 words, title case",
};

export function buildGenerationPrompt(description: string, slots: TextSlot[]): string {
  const lines = slots.map((s) => `${s.id}\t[${LENGTH_GUIDE[s.kind]}]\t${s.current}`);
  return [
    "Here is a description of the business this website is for:",
    "",
    description.trim(),
    "",
    "Below is one line per piece of text to write, tab-separated:",
    "id, a length guide, and the placeholder describing what belongs there.",
    "",
    lines.join("\n"),
    "",
    'Reply with only a JSON object mapping each id to its replacement text: {"id": "text"}.',
    "No markdown, no code fence, no commentary.",
  ].join("\n");
}

export const GENERATION_SYSTEM_PROMPT = [
  "You write website copy. You are filling in a template for a real business.",
  "",
  "Rules:",
  "- Write only what the business description supports. Never invent a statistic,",
  "  a customer quote, an award, a price, or a year founded. If a slot asks for one",
  "  and the description doesn't provide it, write a truthful non-specific line instead.",
  "- Match the length guide for each slot exactly. These sit in a fixed layout;",
  "  copy that runs long breaks the design.",
  "- Plain sentence case. No emoji, no exclamation marks, no marketing throat-clearing",
  '  ("In today\'s fast-paced world"), no em-dash-heavy rhythm.',
  "- Reply with JSON only.",
].join("\n");

/**
 * Parses the model's reply into slot values. Tolerates a code fence and
 * surrounding prose, keeps only ids that were actually asked for, and
 * drops anything that isn't a non-empty string — a malformed reply should
 * degrade to "some slots kept their placeholder", never to a corrupt page.
 */
export function parseGeneratedCopy(raw: string, slots: TextSlot[]): Record<string, string> {
  const known = new Set(slots.map((s) => s.id));
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  const out: Record<string, string> = {};
  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!known.has(id)) continue;
    if (typeof value !== "string" || !value.trim()) continue;
    out[id] = value.trim();
  }
  return out;
}
