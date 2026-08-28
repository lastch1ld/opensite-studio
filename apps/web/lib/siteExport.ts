import type { Prisma } from "@prisma/client";

// Whole-site export as one JSON document. The point of a self-hosted CMS
// is that the content is yours, and until now the only way to get a site
// out of one was `pg_dump` of everything, including other people's sites.
//
// Two rules the shape follows:
//
// - Secrets never leave. Anything derived from SECRETS_ENCRYPTION_KEY is
//   useless elsewhere and dangerous here, so `SiteSettings.aiChat`'s
//   encrypted provider key is stripped rather than exported. So are
//   hashed API keys, which aren't content at all.
// - Media files are referenced, not embedded. A JSON document with
//   base64'd images is neither readable nor a sane size; the export lists
//   what a site references so an importer (or a person) knows which files
//   to bring along from the media volume.

export const SITE_EXPORT_VERSION = 1;

type Json = Prisma.JsonValue;

export type SiteExport = {
  exportVersion: number;
  exportedAt: string;
  site: { name: string; subdomain: string; customDomain: string | null; mode: string; defaultLocalePrefixed: boolean };
  theme: Json | null;
  pages: {
    slug: string;
    title: string;
    isHome: boolean;
    parentSlug: string | null;
    collectionId: string | null;
    seo: Json | null;
    draftContent: Json;
    publishedContent: Json | null;
  }[];
  templates: { name: string; type: string; content: Json; condition: Json; trigger: Json | null; priority: number }[];
  collections: { id: string; name: string; fieldSchema: Json; items: { data: Json }[] }[];
  locales: { code: string; label: string; isDefault: boolean }[];
  translations: { localeCode: string; entityType: string; entityId: string; blockId: string | null; field: string; value: string }[];
  settings: Json | null;
  media: { storageKey: string; url: string; mimeType: string; altText: string | null }[];
};

/** Strips the encrypted provider key out of a SiteSettings row's JSON. */
export function redactSettings(settings: Json | null | undefined): Json | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return (settings as Json) ?? null;
  const out: Record<string, Json> = { ...(settings as Record<string, Json>) };
  const aiChat = out.aiChat;
  if (aiChat && typeof aiChat === "object" && !Array.isArray(aiChat)) {
    const { apiKeyEncrypted: _dropped, ...rest } = aiChat as Record<string, Json>;
    out.aiChat = { ...rest, hasApiKey: Boolean(_dropped) };
  }
  return out as Json;
}

/** `my-site-2026-08-28.opensite.json` — dated so successive exports don't overwrite each other. */
export function exportFilename(subdomain: string, now = new Date()): string {
  return `${subdomain}-${now.toISOString().slice(0, 10)}.opensite.json`;
}
