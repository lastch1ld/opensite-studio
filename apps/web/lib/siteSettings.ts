// Shapes stored in SiteSettings' Json fields (docs/integrations.md's
// "Shared plumbing" — one settings/secrets store, reused by every
// integration rather than a bespoke table per feature).

export type CookieCategory = "analytics" | "marketing";

export type CookieBannerSettings = {
  enabled: boolean;
  // "necessary" is always active and never shown as a toggle; these are the
  // optional categories the banner offers the visitor a choice over.
  categories: CookieCategory[];
  policyUrl?: string;
};

export function defaultCookieBannerSettings(): CookieBannerSettings {
  return { enabled: false, categories: ["analytics", "marketing"], policyUrl: "" };
}

export type NewsletterSettings = {
  provider: "storeOnly" | "webhook";
  webhookUrl?: string;
};

export function defaultNewsletterSettings(): NewsletterSettings {
  return { provider: "storeOnly" };
}

// Known AI-answer-engine crawlers (docs/integrations.md "GEO" — "Explicit
// crawler access control for known AI bots ... as a robots.txt setting the
// site owner can toggle, rather than a blanket allow/deny"). robots.txt
// respects this alongside the blanket allowAll/blockAll modes.
export const KNOWN_AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
] as const;

export type AiCrawlerBot = (typeof KNOWN_AI_CRAWLERS)[number];

export type AiCrawlerSettings = {
  mode: "allowAll" | "blockAll" | "custom";
  // Only consulted when mode === "custom" — the bots to Disallow while
  // every other (non-AI) crawler stays unaffected.
  blockedBots: AiCrawlerBot[];
};

export function defaultAiCrawlerSettings(): AiCrawlerSettings {
  return { mode: "allowAll", blockedBots: [] };
}

// Generic third-party chat-widget embed (docs/integrations.md "Chatbots" —
// explicitly the Intercom/Crisp/Tawk.to-style generic embed, not a
// first-party AI chat app). `provider` is informational only (drives the
// settings-panel placeholder copy); the actual injected content is always
// the pasted `snippet`, run the same sandboxed-iframe way as the `embed`
// block type.
export type ChatbotProvider = "custom" | "intercom" | "crisp" | "tawkto";

export type ChatbotEmbedSettings = {
  enabled: boolean;
  provider: ChatbotProvider;
  snippet: string;
};

export function defaultChatbotEmbedSettings(): ChatbotEmbedSettings {
  return { enabled: false, provider: "custom", snippet: "" };
}

// AI Mode site config (docs/ai-mode.md) — provider/model/system prompt for
// an AI_CHAT site's chat proxy. `apiKeyEncrypted` holds the AES-256-GCM
// ciphertext (lib/secrets.ts) and must never reach the client: every route
// that sends this settings shape to the browser runs it through
// `redactAiChatSettings` first, per the doc's "write-only field from the
// client's perspective" requirement. Only an Anthropic adapter exists so
// far (lib/ai/anthropic.ts); `provider` already models room for more.
export type AiProvider = "anthropic" | "openai" | "openai-compatible";

export type AiChatSettings = {
  provider: AiProvider;
  model: string;
  systemPrompt: string;
  baseUrl?: string;
  apiKeyEncrypted?: string;
};

export type AiChatSettingsPublic = Omit<AiChatSettings, "apiKeyEncrypted"> & { hasApiKey: boolean };

export function defaultAiChatSettings(): AiChatSettings {
  return { provider: "anthropic", model: "claude-3-5-sonnet-20241022", systemPrompt: "" };
}

export function redactAiChatSettings(settings: AiChatSettings): AiChatSettingsPublic {
  const { apiKeyEncrypted, ...rest } = settings;
  return { ...rest, hasApiKey: Boolean(apiKeyEncrypted) };
}

// docs/starter-templates.md's Aperture port of Analytics adapters
// (Plausible/GA4/Umami) — config'd site-level the same way as every other
// integration in this file, not hardcoded. `enabled` gates injection
// independent of which provider is selected, mirroring ChatbotEmbedSettings'
// shape/style exactly. Only the fields the selected provider needs are ever
// read by PublishedPage.tsx; the others are left populated or blank
// harmlessly.
export type AnalyticsProvider = "none" | "plausible" | "ga4" | "umami";

export type AnalyticsSettings = {
  enabled: boolean;
  provider: AnalyticsProvider;
  plausibleDomain?: string;
  ga4MeasurementId?: string;
  umamiWebsiteId?: string;
  umamiScriptUrl?: string;
};

export function defaultAnalyticsSettings(): AnalyticsSettings {
  return { enabled: false, provider: "none" };
}

// docs/reference-sites-plan.md Tier 4's custom font upload (5/13 reference
// sites use a bespoke/licensed display face). `format` drives the
// `@font-face` `src: url(...) format(...)` hint (lib/customFonts.ts) —
// derived once at upload time from the file's mimeType rather than
// re-sniffed on every render.
export type CustomFontFormat = "woff2" | "woff" | "truetype" | "opentype";

export type CustomFont = {
  id: string;
  name: string;
  mediaId: string;
  url: string;
  format: CustomFontFormat;
};

export function defaultCustomFonts(): CustomFont[] {
  return [];
}

const FONT_FORMAT_BY_MIME_TYPE: Record<string, CustomFontFormat> = {
  "font/woff2": "woff2",
  "font/woff": "woff",
  "font/ttf": "truetype",
  "font/otf": "opentype",
  "application/font-woff2": "woff2",
  "application/font-woff": "woff",
  "application/x-font-ttf": "truetype",
  "application/x-font-truetype": "truetype",
  "application/vnd.ms-opentype": "opentype",
  "application/x-font-opentype": "opentype",
};

// Falls back to the file extension when the browser sent a generic/empty
// mimeType (common for .ttf/.otf uploads), then to "truetype" as the most
// permissive guess rather than rejecting the upload outright.
export function customFontFormat(mimeType: string, filename: string): CustomFontFormat {
  if (FONT_FORMAT_BY_MIME_TYPE[mimeType]) return FONT_FORMAT_BY_MIME_TYPE[mimeType];
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "woff2") return "woff2";
  if (ext === "woff") return "woff";
  if (ext === "otf") return "opentype";
  return "truetype";
}

const FONT_EXTENSIONS = [".woff2", ".woff", ".ttf", ".otf"];

export function isFontFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return FONT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
