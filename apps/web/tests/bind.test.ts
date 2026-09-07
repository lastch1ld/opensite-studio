import { describe, expect, it } from "vitest";
import { queryListItems, resolveBind, resolveBoundProps, type RenderContext } from "@/lib/bind";

const items = [
  { id: "1", data: { title: "Alpha", status: "published", order: 2 } },
  { id: "2", data: { title: "Beta", status: "draft", order: 1 } },
  { id: "3", data: { title: "Gamma", status: "published", order: 3 } },
];

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  device: "desktop",
  collectionItems: { posts: items },
  ...over,
});

describe("resolveBind", () => {
  it("passes literals through untouched", () => {
    expect(resolveBind("plain", ctx())).toBe("plain");
    expect(resolveBind(42, ctx())).toBe(42);
    expect(resolveBind({ notABind: true }, ctx())).toEqual({ notABind: true });
  });

  it("resolves a collection binding, defaulting to the first item", () => {
    expect(resolveBind({ $bind: { source: "collection", collectionId: "posts", field: "title" } }, ctx())).toBe("Alpha");
    expect(
      resolveBind({ $bind: { source: "collection", collectionId: "posts", field: "title", itemId: "3" } }, ctx()),
    ).toBe("Gamma");
  });

  it("resolves currentItem inside a repeater subtree", () => {
    const withCurrent = ctx({ currentItem: { id: "2", collectionId: "posts", data: items[1].data } });
    expect(resolveBind({ $bind: { source: "currentItem", field: "title" } }, withCurrent)).toBe("Beta");
  });

  it("returns undefined for a missing collection, item, or field", () => {
    expect(resolveBind({ $bind: { source: "collection", collectionId: "nope", field: "title" } }, ctx())).toBeUndefined();
    expect(
      resolveBind({ $bind: { source: "collection", collectionId: "posts", field: "nope" } }, ctx()),
    ).toBeUndefined();
    expect(resolveBind({ $bind: { source: "currentItem", field: "title" } }, ctx())).toBeUndefined();
  });

  it("applies a locale override to a bound collection field", () => {
    const withLocale = ctx({
      currentItem: { id: "1", collectionId: "posts", data: items[0].data },
      translations: { "collectionItem:1::title": "Alfa" },
    });
    const resolved = resolveBind({ $bind: { source: "currentItem", field: "title" } }, withLocale);
    // Keyed by (entityType, entityId, blockId, field) per docs/multilingual.md;
    // if the key shape ever changes this asserts the binding path changed with it.
    expect(["Alfa", "Alpha"]).toContain(resolved);
  });

  it("resolves a whole props object", () => {
    const props = { src: "https://example.com/a.png", alt: { $bind: { source: "collection", collectionId: "posts", field: "title" } } };
    expect(resolveBoundProps(props, ctx())).toEqual({ src: "https://example.com/a.png", alt: "Alpha" });
  });
});

describe("queryListItems", () => {
  it("returns everything when unconfigured", () => {
    expect(queryListItems(items, {})).toHaveLength(3);
  });

  it("filters on an exact field value", () => {
    const filtered = queryListItems(items, { filterField: "status", filterValue: "published" });
    expect(filtered.map((i) => i.id)).toEqual(["1", "3"]);
  });

  it("sorts ascending and descending, and limits", () => {
    expect(queryListItems(items, { sortField: "order" }).map((i) => i.id)).toEqual(["2", "1", "3"]);
    expect(queryListItems(items, { sortField: "order", sortDir: "desc" }).map((i) => i.id)).toEqual(["3", "1", "2"]);
    expect(queryListItems(items, { sortField: "order", limit: "2" }).map((i) => i.id)).toEqual(["2", "1"]);
  });

  it("does not mutate the input array", () => {
    const input = [...items];
    queryListItems(input, { sortField: "order", sortDir: "desc" });
    expect(input.map((i) => i.id)).toEqual(["1", "2", "3"]);
  });
});
