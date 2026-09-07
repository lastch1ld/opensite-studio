import { describe, expect, it } from "vitest";
import { builtinBlockTypeUnion, registeredBlockTypes } from "./support/registry";

describe("block registry", () => {
  it("parses a plausible set of built-in types", () => {
    // Guards tests/support/registry.ts's source-text parse: if the regex
    // silently stops matching, every other test that checks "is this block
    // type registered?" would pass vacuously.
    const types = registeredBlockTypes();
    expect(types.length).toBeGreaterThan(15);
    expect(types).toContain("section");
    expect(types).toContain("heading");
    expect(new Set(types).size).toBe(types.length);
  });

  it("keeps BuiltinBlockType in step with what registry.tsx registers", () => {
    // Two hand-maintained lists of the same thing: the union in
    // components/blocks/types.ts is what block-tree code type-checks
    // against, the registry object is what actually renders.
    expect([...registeredBlockTypes()].sort()).toEqual([...builtinBlockTypeUnion()].sort());
  });
});
