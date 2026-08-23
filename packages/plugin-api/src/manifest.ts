// The declared-intent permission vocabulary a plugin.json can request.
// Deliberately small and concrete (docs/plugins-and-extensibility.md: "keep
// the permission vocabulary small and concrete") — this is a list a
// self-hoster reads before deciding to trust a plugin, not an enforced
// sandbox (see PluginApiClient's doc comment in ./client.ts for the actual
// trust model). Extend this list only when a real capability needs a new
// entry; don't pre-add speculative permissions nothing checks yet.
export const KNOWN_PLUGIN_PERMISSIONS = [
  // Registers one or more blocks via @opensite/block-sdk's registerBlock.
  // Expected on essentially every plugin in this pass, since block
  // registration is the only capability actually wired up end to end.
  "adds:block",
  // Reserved for a future plugin-owned Next.js API route
  // (app/api/plugins/[name]/**) — not implemented yet; a plugin may
  // declare it now so the manifest already documents the intent, but
  // nothing grants or checks it today.
  "adds:apiRoute",
  // Read-only access to a Site's public settings via PluginApiClient.
  "reads:siteSettings",
  // Read-only access to a Site's Theme tokens via PluginApiClient.
  "reads:theme",
  // Read-only access to a Site's Collection items via PluginApiClient.
  "reads:collections",
] as const;

export type PluginPermission = (typeof KNOWN_PLUGIN_PERMISSIONS)[number];

export type PluginManifest = {
  // Unique plugin id, kebab-case (also used to namespace its block types —
  // see docs/plugin-sdk.md). Matches the plugin's directory name under
  // /plugins by convention, though the loader doesn't enforce that.
  name: string;
  // Semver string, informational only in this pass (no version resolution
  // or compatibility checks are performed).
  version: string;
  description?: string;
  // Path to the plugin's entry module, relative to the plugin's own
  // directory (e.g. "./index.mjs"). Dynamically imported once at server
  // startup — see apps/web/lib/plugins/loadPlugins.ts. Must be plain,
  // already-runnable JavaScript (CommonJS or ESM): it's loaded directly by
  // Node, not run through the Next.js/webpack build, so it can't use JSX
  // or TypeScript syntax without the plugin author compiling it first.
  main: string;
  // What this plugin declares it needs. Validated against
  // KNOWN_PLUGIN_PERMISSIONS below (an unknown permission fails manifest
  // validation) but not otherwise enforced by the loader in this pass —
  // see the trust-model note in ./client.ts.
  permissions: PluginPermission[];
};

export class PluginManifestError extends Error {
  constructor(pluginDir: string, message: string) {
    super(`Invalid plugin manifest at "${pluginDir}": ${message}`);
    this.name = "PluginManifestError";
  }
}

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const VERSION_RE = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

/**
 * Validates a parsed `plugin.json` and returns a well-typed
 * `PluginManifest`, or throws `PluginManifestError` describing exactly
 * what's wrong. A plugin whose manifest is missing, malformed, or
 * requests an unknown permission is refused entirely — it's never
 * partially loaded (docs/plugins-and-extensibility.md's sandboxing item
 * (a): "manifest validation that refuses to load a plugin whose
 * `plugin.json` is malformed or missing required fields").
 */
export function validatePluginManifest(json: unknown, pluginDir: string): PluginManifest {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new PluginManifestError(pluginDir, "plugin.json must be a JSON object");
  }
  const m = json as Record<string, unknown>;

  if (typeof m.name !== "string" || !NAME_RE.test(m.name)) {
    throw new PluginManifestError(pluginDir, '"name" must be a lowercase kebab-case string (e.g. "my-plugin")');
  }
  if (typeof m.version !== "string" || !VERSION_RE.test(m.version)) {
    throw new PluginManifestError(pluginDir, '"version" must be a semver string (e.g. "0.1.0")');
  }
  if (typeof m.main !== "string" || m.main.trim() === "") {
    throw new PluginManifestError(pluginDir, '"main" must be a non-empty relative path to the plugin\'s entry module');
  }
  if (!Array.isArray(m.permissions)) {
    throw new PluginManifestError(pluginDir, '"permissions" must be an array (can be empty)');
  }
  for (const p of m.permissions) {
    if (typeof p !== "string" || !(KNOWN_PLUGIN_PERMISSIONS as readonly string[]).includes(p)) {
      throw new PluginManifestError(
        pluginDir,
        `unknown permission "${String(p)}" — known permissions: ${KNOWN_PLUGIN_PERMISSIONS.join(", ")}`,
      );
    }
  }
  if (m.description !== undefined && typeof m.description !== "string") {
    throw new PluginManifestError(pluginDir, '"description" must be a string if present');
  }

  return {
    name: m.name,
    version: m.version,
    description: typeof m.description === "string" ? m.description : undefined,
    main: m.main,
    permissions: m.permissions as PluginPermission[],
  };
}
