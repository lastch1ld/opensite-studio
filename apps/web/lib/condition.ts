import type { RenderContext } from "./bind";

// Starts intentionally small — device + collection-field-equality + boolean
// combinators — rather than a full rules engine (docs/collections.md).
export type Condition =
  | { type: "always" }
  | { type: "collectionFieldEquals"; collectionId: string; field: string; value: unknown }
  | { type: "deviceIs"; device: "desktop" | "tablet" | "mobile" }
  | { type: "and" | "or"; conditions: Condition[] };

// One condition engine shared by block-level visibility (BlockRenderer) and
// Template targeting (header/footer/pageTemplate/collectionItemTemplate),
// per docs/theme-builder.md's "one condition engine used in [multiple]
// places, not a parallel targeting language."
export function evaluateCondition(condition: Condition | undefined | null, ctx: RenderContext): boolean {
  if (!condition) return true;
  switch (condition.type) {
    case "always":
      return true;
    case "deviceIs":
      return ctx.device === condition.device;
    case "collectionFieldEquals":
      return (
        ctx.currentItem?.collectionId === condition.collectionId &&
        ctx.currentItem?.data?.[condition.field] === condition.value
      );
    case "and":
      return condition.conditions.every((c) => evaluateCondition(c, ctx));
    case "or":
      return condition.conditions.some((c) => evaluateCondition(c, ctx));
    default:
      return true;
  }
}
