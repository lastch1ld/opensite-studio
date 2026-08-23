import type { PluginPermission } from "./manifest";

// Deliberately narrow, read-only views — never the raw Prisma row shape.
// Extend carefully, and never add a secret-bearing field (encrypted API
// keys, webhook URLs with embedded credentials, etc.) without
// threat-modeling the permission that guards it first.
export type PluginSiteSettingsView = {
  siteId: string;
  name: string;
};

export type PluginThemeView = {
  tokens: Record<string, unknown>;
};

export type PluginCollectionItemView = {
  id: string;
  data: Record<string, unknown>;
};

export class PluginPermissionError extends Error {
  constructor(pluginName: string, permission: PluginPermission) {
    super(`Plugin "${pluginName}" called a PluginApiClient method requiring "${permission}", which it did not declare in plugin.json`);
    this.name = "PluginPermissionError";
  }
}

/**
 * The restricted, permission-checked surface a plugin's server-side code
 * should use instead of importing the host app's raw Prisma client
 * (apps/web/lib/db.ts) directly. This package only defines the shape;
 * apps/web supplies the concrete implementation
 * (apps/web/lib/plugins/pluginApiClient.ts, backed by Prisma) scoped to
 * whichever permissions that plugin's manifest declared.
 *
 * TRUST MODEL — read this before assuming any of this is a security
 * boundary:
 *
 * Plugins in opensite-studio are trusted local code a self-hoster
 * deliberately installs by dropping a directory under /plugins — the same
 * trust level as adding an npm dependency to package.json, NOT sandboxed
 * untrusted code. A plugin's entry module runs as plain Node.js code in
 * the same process as the host app (docs/plugins-and-extensibility.md:
 * "a plugin's server-side code running inside the same Node process as
 * auth/DB access is a real risk once third-party plugins are allowed").
 * Nothing in this codebase stops a plugin from `require("@prisma/client")`
 * itself, reading environment variables, or making arbitrary network
 * calls — full V8-isolate-style sandboxing of third-party Node code is a
 * large, separate effort and explicitly out of scope for this pass.
 *
 * What this class actually provides, given that:
 *   - A documented, narrower *default* surface, so raw Prisma access is
 *     never the path of least resistance for a plugin author who just
 *     wants to read some site data.
 *   - A single place permission checks run for plugins that use it as
 *     intended (`requirePermission` below, checked against the
 *     permissions that plugin's manifest.json declared).
 *   - Manifest validation (see ./manifest.ts) that refuses to load a
 *     plugin whose plugin.json is malformed, missing required fields, or
 *     requests an unknown permission — so at minimum every self-hoster
 *     gets an accurate, enforced-at-load-time list of what a plugin says
 *     it wants, even though nothing stops the plugin's code from doing
 *     more than that list once it's running.
 *
 * Do not describe this to end users as protection against a malicious
 * plugin author. It isn't.
 */
export abstract class PluginApiClient {
  constructor(
    protected readonly pluginName: string,
    protected readonly grantedPermissions: readonly PluginPermission[],
  ) {}

  protected requirePermission(permission: PluginPermission): void {
    if (!this.grantedPermissions.includes(permission)) {
      throw new PluginPermissionError(this.pluginName, permission);
    }
  }

  abstract getSiteSettings(siteId: string): Promise<PluginSiteSettingsView | null>;
  abstract getTheme(siteId: string): Promise<PluginThemeView | null>;
  abstract getCollectionItems(siteId: string, collectionId: string): Promise<PluginCollectionItemView[]>;
}
