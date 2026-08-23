import { db } from "@/lib/db";
import {
  PluginApiClient,
  type PluginPermission,
  type PluginSiteSettingsView,
  type PluginThemeView,
  type PluginCollectionItemView,
} from "@opensite/plugin-api";

// The concrete, Prisma-backed implementation of the restricted client
// shape @opensite/plugin-api defines. See PluginApiClient's doc comment
// for the trust model this operates under — this class narrows *what* a
// plugin can read through it, it does not sandbox the plugin's process.
export class DbPluginApiClient extends PluginApiClient {
  constructor(pluginName: string, grantedPermissions: readonly PluginPermission[]) {
    super(pluginName, grantedPermissions);
  }

  async getSiteSettings(siteId: string): Promise<PluginSiteSettingsView | null> {
    this.requirePermission("reads:siteSettings");
    const site = await db.site.findUnique({ where: { id: siteId }, select: { id: true, name: true } });
    if (!site) return null;
    return { siteId: site.id, name: site.name };
  }

  async getTheme(siteId: string): Promise<PluginThemeView | null> {
    this.requirePermission("reads:theme");
    const theme = await db.theme.findUnique({ where: { siteId } });
    if (!theme) return null;
    return { tokens: (theme.tokens as Record<string, unknown>) ?? {} };
  }

  async getCollectionItems(siteId: string, collectionId: string): Promise<PluginCollectionItemView[]> {
    this.requirePermission("reads:collections");
    // Scope the query to `siteId` explicitly rather than trusting
    // `collectionId` alone — a plugin only granted `reads:collections`
    // shouldn't be able to read another site's collection by guessing/
    // brute-forcing its id.
    const collection = await db.collection.findFirst({ where: { id: collectionId, siteId } });
    if (!collection) return [];
    const items = await db.collectionItem.findMany({ where: { collectionId: collection.id } });
    return items.map((item) => ({ id: item.id, data: (item.data as Record<string, unknown>) ?? {} }));
  }
}
