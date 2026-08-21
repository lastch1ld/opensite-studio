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
