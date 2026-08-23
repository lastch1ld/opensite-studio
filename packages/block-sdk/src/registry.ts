import type { BlockDefinition } from "./types";

// One registry per process, shared by every consumer: apps/web's built-in
// blocks (components/blocks/registry.tsx) and any plugin loaded from
// /plugins (apps/web/lib/plugins/loadPlugins.ts) call the same
// `registerBlock` into the same module-level Map — there's exactly one
// registration mechanism, not a separate one for "first-party" vs
// "third-party" blocks. See docs/plugin-sdk.md.
const registry = new Map<string, BlockDefinition<unknown>>();

/**
 * Registers a block so the editor and public renderer can look it up by
 * `type`. This is the one mechanism both apps/web's built-in blocks and
 * plugin-authored blocks go through — see docs/plugin-sdk.md.
 *
 * Re-registering a `type` that's already present overwrites the previous
 * definition and logs a warning rather than throwing: a self-hosted app
 * shouldn't crash entirely over one misbehaving plugin (see
 * apps/web/lib/plugins/loadPlugins.ts, which loads each plugin in its own
 * try/catch). Namespace your plugin's block types
 * (`your-plugin-name/block-name`) to avoid accidentally shadowing a
 * built-in or another plugin's block.
 */
export function registerBlock<TCtx = unknown>(definition: BlockDefinition<TCtx>): void {
  if (!definition || typeof definition.type !== "string" || definition.type.trim() === "") {
    throw new Error("registerBlock: definition.type must be a non-empty string");
  }
  if (typeof definition.render !== "function") {
    throw new Error(`registerBlock: block "${definition.type}" is missing a render() function`);
  }
  if (registry.has(definition.type)) {
    console.warn(`[block-sdk] registerBlock: overwriting an already-registered block type "${definition.type}"`);
  }
  registry.set(definition.type, definition as BlockDefinition<unknown>);
}

/** Looks up a registered block definition by `type`, or `undefined` if none is registered. */
export function getBlockDefinition<TCtx = unknown>(type: string): BlockDefinition<TCtx> | undefined {
  return registry.get(type) as BlockDefinition<TCtx> | undefined;
}

/** All currently registered block definitions (built-in + plugin), in registration order. */
export function getAllBlockDefinitions<TCtx = unknown>(): BlockDefinition<TCtx>[] {
  return Array.from(registry.values()) as BlockDefinition<TCtx>[];
}

/**
 * Test-only escape hatch. The registry is a deliberate module-level
 * singleton (see comment above `registry`), so tests that register their
 * own blocks need a way to reset state between cases.
 */
export function __resetRegistryForTests(): void {
  registry.clear();
}
