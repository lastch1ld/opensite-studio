// Instance-level whitelabeling (docs/ai-mode.md "CMS-chrome whitelabeling")
// — the first settings surface in this codebase that isn't scoped to a
// Site. Read from env vars rather than a DB `AppSettings` row: simpler for
// this first pass per the doc's own framing ("read from env vars or a
// single AppSettings row at minimum for the MVP-of-this-feature"), and this
// is operator-set-once-at-deploy config, not something changed at runtime
// through a UI. Applied to the dashboard shell and login/signup pages only
// — explicitly not per-site, and not the published-site renderer (see
// docs/ai-mode.md's whitelabeling section).

export type AppSettings = {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
};

export function getAppSettings(): AppSettings {
  return {
    appName: process.env.APP_NAME?.trim() || "OpenSite Studio",
    logoUrl: process.env.APP_LOGO_URL?.trim() || null,
    faviconUrl: process.env.APP_FAVICON_URL?.trim() || null,
    primaryColor: process.env.APP_PRIMARY_COLOR?.trim() || null,
  };
}
