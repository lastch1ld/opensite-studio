import type { Condition } from "./condition";
import { evaluateCondition } from "./condition";
import type { RenderContext } from "./bind";

export type TemplateLite = {
  id: string;
  type: string;
  content: unknown;
  condition: unknown;
  // Popup-only (lib/popupTrigger.ts's PopupSettings); null/undefined for
  // every other Template type.
  trigger?: unknown;
  priority: number;
};

// Picks the best-matching Template of `type` for a render. Highest
// `priority` wins; on a tie, a specific (non-"always") condition beats
// "always" (docs/theme-builder.md: "the more specific condition wins").
export function resolveTemplate(templates: TemplateLite[], type: string, ctx: RenderContext): TemplateLite | null {
  const candidates = templates.filter(
    (t) => t.type === type && evaluateCondition((t.condition as Condition) ?? { type: "always" }, ctx),
  );
  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    const aAlways = (a.condition as Condition | undefined)?.type === "always";
    const bAlways = (b.condition as Condition | undefined)?.type === "always";
    if (aAlways !== bAlways) return aAlways ? 1 : -1;
    return 0;
  });
  return candidates[0];
}

// Popups aren't a single-slot type like header/footer/pageTemplate — several
// can be eligible on the same Page at once (e.g. an exit-intent popup and a
// scroll popup), each firing on its own trigger. Returns every match instead
// of picking one winner.
export function resolveTemplates(templates: TemplateLite[], type: string, ctx: RenderContext): TemplateLite[] {
  return templates.filter(
    (t) => t.type === type && evaluateCondition((t.condition as Condition) ?? { type: "always" }, ctx),
  );
}
