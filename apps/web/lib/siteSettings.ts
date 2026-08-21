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
