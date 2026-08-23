import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { registerBlock, type BlockDefinition } from "@opensite/block-sdk";
import { validatePluginManifest, PluginManifestError, type PluginManifest } from "@opensite/plugin-api";
import { DbPluginApiClient } from "./pluginApiClient";

// Self-hosted install model (docs/plugins-and-extensibility.md): "drop a
// package in /plugins + restart", not a hosted marketplace. This resolves
// where that directory is. Default assumes apps/web's cwd is the app
// directory itself (true for both `next dev`/`next start` run from
// apps/web per the README quickstart, and the Docker image — see
// apps/web/Dockerfile), so /plugins is two levels up, next to /apps.
// PLUGINS_DIR overrides this with an absolute path for anyone whose
// deployment doesn't match that layout (e.g. a different volume mount).
export function getPluginsDir(): string {
  return process.env.PLUGINS_DIR?.trim() || path.resolve(process.cwd(), "..", "..", "plugins");
}

// The shape a plugin's entry module must export — see
// docs/plugin-sdk.md's "Writing a plugin". `activate` is optional and
// reserved for future server-side plugin logic (establishing
// PluginApiClient's call shape now, per
// docs/plugins-and-extensibility.md's sandboxing item (b)) — a
// block-only plugin like the example plugin doesn't need it.
type PluginModule = {
  blocks?: BlockDefinition[];
  activate?: (api: DbPluginApiClient) => void | Promise<void>;
};

// These paths are only known at server runtime (computed from PLUGINS_DIR
// or disk contents, never a literal string Turbopack/webpack can see at
// build time). Without the ignore comments below, Next's build-time
// static analysis treats every fs call reachable from a dynamic path as a
// reason to trace and bundle the *entire* project into the server output
// (see the "Dynamic filesystem access causes tracing of the whole
// project" build warning this silences) — harmless for correctness, but
// it can bloat deploy size for no reason, since we already know these
// paths are outside anything that needs bundling.
function readManifest(pluginDir: string): PluginManifest {
  const manifestPath = path.join(pluginDir, "plugin.json");
  if (!fs.existsSync(/* turbopackIgnore: true */ manifestPath)) {
    throw new PluginManifestError(pluginDir, "missing plugin.json");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ manifestPath, "utf8"));
  } catch (err) {
    throw new PluginManifestError(pluginDir, `plugin.json is not valid JSON (${(err as Error).message})`);
  }
  return validatePluginManifest(parsed, pluginDir);
}

async function loadOnePlugin(pluginDir: string): Promise<void> {
  const manifest = readManifest(pluginDir);

  const entryPath = path.resolve(pluginDir, manifest.main);
  if (!fs.existsSync(/* turbopackIgnore: true */ entryPath)) {
    throw new PluginManifestError(pluginDir, `"main" points to a file that doesn't exist: ${manifest.main}`);
  }

  // Plugin entry points live outside apps/web's source tree at a path
  // only known at server-runtime (after scanning the disk above), so
  // Next's build-time bundler can never see or bundle them — this must
  // be a genuinely dynamic, unbundled import. `webpackIgnore` forces
  // webpack/Turbopack to leave this `import()` alone and hand it to
  // Node's own ESM loader instead of trying (and failing) to statically
  // resolve it. See docs/plugin-sdk.md's "Editor canvas vs. public
  // renderer" caveat for what this does and doesn't make available where.
  const mod = (await import(/* webpackIgnore: true */ pathToFileURL(entryPath).href)) as PluginModule;

  const blocks = Array.isArray(mod.blocks) ? mod.blocks : [];
  if (manifest.permissions.includes("adds:block") && blocks.length === 0) {
    console.warn(`[plugins] "${manifest.name}" declares "adds:block" but its entry module exports no blocks`);
  }
  for (const block of blocks) {
    if (!manifest.permissions.includes("adds:block")) {
      console.warn(
        `[plugins] "${manifest.name}" exports block "${block?.type}" but didn't declare the "adds:block" permission in plugin.json — registering it anyway (permissions are declared intent, not an enforced gate — see docs/plugin-sdk.md's trust model), but fix the manifest.`,
      );
    }
    registerBlock(block);
  }

  if (typeof mod.activate === "function") {
    const api = new DbPluginApiClient(manifest.name, manifest.permissions);
    await mod.activate(api);
  }

  console.log(`[plugins] loaded "${manifest.name}" v${manifest.version} (${blocks.length} block${blocks.length === 1 ? "" : "s"})`);
}

let loaded = false;

/**
 * Scans the top-level /plugins directory (see `getPluginsDir`), validates
 * each subdirectory's plugin.json, dynamically imports its entry point,
 * and registers whatever blocks it exports via @opensite/block-sdk's
 * `registerBlock`. Deliberately simple/synchronous-feeling — this runs
 * once at server startup (apps/web/instrumentation.ts), not a hot-reload
 * system; a newly dropped plugin needs a server restart to be picked up.
 *
 * One plugin failing to load (bad manifest, throwing entry module, etc.)
 * is logged and skipped — it never takes the rest of the app down.
 */
export async function loadPlugins(): Promise<void> {
  if (loaded) return;
  loaded = true;

  const pluginsDir = getPluginsDir();
  if (!fs.existsSync(/* turbopackIgnore: true */ pluginsDir)) return;

  const entries = fs.readdirSync(/* turbopackIgnore: true */ pluginsDir, { withFileTypes: true }).filter((e) => e.isDirectory());
  for (const entry of entries) {
    const pluginDir = path.join(/* turbopackIgnore: true */ pluginsDir, entry.name);
    try {
      await loadOnePlugin(pluginDir);
    } catch (err) {
      console.error(`[plugins] failed to load plugin at "${pluginDir}": ${(err as Error).message}`);
    }
  }
}
