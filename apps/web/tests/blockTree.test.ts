import { describe, expect, it } from "vitest";
import type { Block } from "@/components/blocks/types";
import { addBlockAt, cloneWithNewIds, deleteBlock, findBlock, findParent, moveBlock, updateBlock } from "@/lib/blockTree";

const leaf = (id: string): Block => ({ id, type: "text", props: {}, style: { base: {} } });
const box = (id: string, children: Block[]): Block => ({ id, type: "section", props: {}, style: { base: {} }, children });

// root
//  ├ a
//  ├ b ── b1, b2
//  └ c
const tree = (): Block => box("root", [leaf("a"), box("b", [leaf("b1"), leaf("b2")]), leaf("c")]);

const childIds = (root: Block, parentId: string) => (findBlock(root, parentId)?.children ?? []).map((c) => c.id);

describe("findBlock / findParent", () => {
  it("finds nested blocks and their parents", () => {
    expect(findBlock(tree(), "b2")?.id).toBe("b2");
    expect(findParent(tree(), "b2")?.id).toBe("b");
    expect(findParent(tree(), "root")).toBeNull();
    expect(findBlock(tree(), "nope")).toBeNull();
  });
});

describe("addBlockAt", () => {
  it("inserts at an index and clamps out-of-range ones", () => {
    expect(childIds(addBlockAt(tree(), "root", leaf("x"), 1), "root")).toEqual(["a", "x", "b", "c"]);
    expect(childIds(addBlockAt(tree(), "root", leaf("x"), 99), "root")).toEqual(["a", "b", "c", "x"]);
    expect(childIds(addBlockAt(tree(), "root", leaf("x"), -5), "root")).toEqual(["x", "a", "b", "c"]);
  });
});

describe("moveBlock", () => {
  it("reparents into another container", () => {
    const moved = moveBlock(tree(), "a", "b", 1);
    expect(childIds(moved, "root")).toEqual(["b", "c"]);
    expect(childIds(moved, "b")).toEqual(["b1", "a", "b2"]);
  });

  it("adjusts the target index when reordering inside the same parent", () => {
    // Dropping "a" at index 2 means "after b" from the user's point of
    // view; without the shift-back for the removed block it would land
    // after "c" instead.
    expect(childIds(moveBlock(tree(), "a", "root", 2), "root")).toEqual(["b", "a", "c"]);
    expect(childIds(moveBlock(tree(), "c", "root", 0), "root")).toEqual(["c", "a", "b"]);
  });

  it("no-ops rather than detaching a subtree into itself", () => {
    expect(moveBlock(tree(), "b", "b1", 0)).toEqual(tree());
  });

  it("no-ops on a missing block or a root move", () => {
    expect(moveBlock(tree(), "nope", "root", 0)).toEqual(tree());
    expect(moveBlock(tree(), "root", "b", 0)).toEqual(tree());
  });
});

describe("deleteBlock", () => {
  it("removes a nested block and leaves siblings intact", () => {
    const after = deleteBlock(tree(), "b1");
    expect(childIds(after, "b")).toEqual(["b2"]);
    expect(childIds(after, "root")).toEqual(["a", "b", "c"]);
  });
});

describe("updateBlock", () => {
  it("replaces only the targeted block", () => {
    const after = updateBlock(tree(), "b2", (b) => ({ ...b, props: { content: "edited" } }));
    expect(findBlock(after, "b2")?.props).toEqual({ content: "edited" });
    expect(findBlock(after, "b1")?.props).toEqual({});
  });
});

describe("cloneWithNewIds", () => {
  it("regenerates every id in the subtree so the copy is detached", () => {
    const original = findBlock(tree(), "b")!;
    const copy = cloneWithNewIds(original);
    const ids = (b: Block): string[] => [b.id, ...(b.children ?? []).flatMap(ids)];
    expect(ids(copy)).toHaveLength(3);
    expect(ids(copy).some((id) => ids(original).includes(id))).toBe(false);
    expect(new Set(ids(copy)).size).toBe(3);
  });
});
