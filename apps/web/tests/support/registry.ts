import { readFileSync } from "fs";
import { fileURLToPath } from "url";

// components/blocks/registry.tsx is a client-bundle module (JSX, "use
// client" leaf components, motion) — importing it into a Node test would
// drag that whole tree in for one list of strings. The registration source
// of truth is the `builtinBlocks` object literal's keys, so read them out
// of the source text instead. Brittle only if that object stops being a
// plain literal with one type per line, which the file's own shape makes
// unlikely; tests/blockRegistry.test.ts pins the result against
// components/blocks/types.ts's `BuiltinBlockType` union so a silent
// mis-parse fails loudly rather than quietly shrinking the set.
const REGISTRY = fileURLToPath(new URL("../../components/blocks/registry.tsx", import.meta.url));
const TYPES = fileURLToPath(new URL("../../components/blocks/types.ts", import.meta.url));

export function registeredBlockTypes(): string[] {
  const src = readFileSync(REGISTRY, "utf8");
  const start = src.indexOf("const builtinBlocks");
  if (start === -1) throw new Error("registry.tsx no longer declares `const builtinBlocks`.");
  const body = src.slice(start);
  return [...body.matchAll(/^ {2}([a-zA-Z][a-zA-Z0-9]*): \{$/gm)].map((m) => m[1]);
}

export function builtinBlockTypeUnion(): string[] {
  const src = readFileSync(TYPES, "utf8");
  const match = src.match(/export type BuiltinBlockType =([\s\S]*?);/);
  if (!match) throw new Error("types.ts no longer declares `BuiltinBlockType`.");
  return [...match[1].matchAll(/"([a-zA-Z][a-zA-Z0-9]*)"/g)].map((m) => m[1]);
}
