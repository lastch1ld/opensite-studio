import type { Condition } from "./condition";
import { evaluateCondition } from "./condition";
import type { RenderContext } from "./bind";

export type TemplateLite = {
  id: string;
  type: string;
  content: unknown;
  condition: unknown;
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
