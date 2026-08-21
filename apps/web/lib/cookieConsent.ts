import type { CookieCategory } from "./siteSettings";

// Client-side consent state (docs/integrations.md "Cookie Banner": "gates
// whether analytics/marketing scripts actually load... must control script
// loading, not just display a message"). Plain localStorage, readable by
// any script on the page — not React-specific — so a future analytics/
// marketing script tag can call `hasConsent("analytics")` before loading
// itself, without needing to be a React component.
const STORAGE_KEY = "opensite:consent";

export type ConsentState = Partial<Record<CookieCategory, boolean>>;

export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch {
    return null;
  }
}

// Same-tab consumers (e.g. ChatbotEmbed) can't rely on the browser's
// `storage` event — that only fires in *other* tabs — so any component
// that needs to react live to a consent choice (not just on next page
// load) listens for this instead.
export const CONSENT_CHANGE_EVENT = "opensite:consent-change";

export function setConsent(state: ConsentState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

// "necessary" cookies are always allowed and aren't part of the stored
// state; anything else requires an explicit prior grant.
export function hasConsent(category: CookieCategory): boolean {
  const state = getConsent();
  return Boolean(state?.[category]);
}
