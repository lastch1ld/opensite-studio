import { describe, expect, it } from "vitest";
import { evaluateCondition, type Condition } from "@/lib/condition";
import type { RenderContext } from "@/lib/bind";

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({ device: "desktop", ...over });

describe("evaluateCondition", () => {
  it("shows the block when no condition is set", () => {
    // The default has to be "visible" — an unconditioned block is the
    // overwhelmingly common case, and the shared engine is used for
    // Template targeting too, where a null condition means "always apply".
    expect(evaluateCondition(undefined, ctx())).toBe(true);
    expect(evaluateCondition(null, ctx())).toBe(true);
    expect(evaluateCondition({ type: "always" }, ctx())).toBe(true);
  });

  it("matches on device", () => {
    const mobileOnly: Condition = { type: "deviceIs", device: "mobile" };
    expect(evaluateCondition(mobileOnly, ctx({ device: "mobile" }))).toBe(true);
    expect(evaluateCondition(mobileOnly, ctx({ device: "desktop" }))).toBe(false);
  });

  it("matches a collection field only on the right collection", () => {
    const cond: Condition = { type: "collectionFieldEquals", collectionId: "posts", field: "status", value: "published" };
    const item = (collectionId: string, data: Record<string, unknown>) => ({ id: "i1", collectionId, data });
    expect(evaluateCondition(cond, ctx({ currentItem: item("posts", { status: "published" }) }))).toBe(true);
    expect(evaluateCondition(cond, ctx({ currentItem: item("posts", { status: "draft" }) }))).toBe(false);
    expect(evaluateCondition(cond, ctx({ currentItem: item("pages", { status: "published" }) }))).toBe(false);
    expect(evaluateCondition(cond, ctx())).toBe(false);
  });

  it("combines with and/or", () => {
    const mobile: Condition = { type: "deviceIs", device: "mobile" };
    const desktop: Condition = { type: "deviceIs", device: "desktop" };
    expect(evaluateCondition({ type: "or", conditions: [mobile, desktop] }, ctx())).toBe(true);
    expect(evaluateCondition({ type: "and", conditions: [mobile, desktop] }, ctx())).toBe(false);
    expect(evaluateCondition({ type: "and", conditions: [] }, ctx())).toBe(true);
    expect(evaluateCondition({ type: "or", conditions: [] }, ctx())).toBe(false);
    expect(
      evaluateCondition({ type: "and", conditions: [desktop, { type: "or", conditions: [mobile, desktop] }] }, ctx()),
    ).toBe(true);
  });
});
