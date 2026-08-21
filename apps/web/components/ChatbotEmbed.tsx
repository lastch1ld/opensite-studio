"use client";

import { useEffect, useState } from "react";
import type { ChatbotEmbedSettings, CookieBannerSettings } from "@/lib/siteSettings";
import { hasConsent, CONSENT_CHANGE_EVENT } from "@/lib/cookieConsent";

// Cross-cutting, site-wide injection mounted from PublishedPage.tsx
// alongside CookieBanner/PopupHost (docs/integrations.md "Chatbots" —
// generic third-party embed, injected on public pages only). The pasted
// snippet is site-owner-supplied third-party HTML/script, so it runs the
// same sandboxed-iframe way the `embed` block type already established
// (components/blocks/registry.tsx) rather than a new unguarded injection
// point.
export function ChatbotEmbed({
  settings,
  cookieBannerSettings,
}: {
  settings: ChatbotEmbedSettings;
  cookieBannerSettings: CookieBannerSettings;
}) {
  // Chat widgets set their own session/identity cookies, closest to the
  // "marketing" category (third-party engagement tooling) rather than
  // "analytics" — same class of script the cookie banner's marketing
  // category is meant to gate. If the site has no cookie banner enabled at
  // all there's no consent mechanism to respect, so the embed loads
  // unconditionally in that case.
  // Lazy initializer (same as CookieBanner's `visible` state) since
  // localStorage is only readable client-side.
  const [allowed, setAllowed] = useState(() => !cookieBannerSettings.enabled || hasConsent("marketing"));

  useEffect(() => {
    if (!cookieBannerSettings.enabled) return;
    const onConsent = () => setAllowed(hasConsent("marketing"));
    window.addEventListener(CONSENT_CHANGE_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onConsent);
  }, [cookieBannerSettings.enabled]);

  if (!settings.enabled || !settings.snippet.trim() || !allowed) return null;

  const doc = `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;}</style></head><body>${settings.snippet}</body></html>`;

  return (
    <iframe
      srcDoc={doc}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      title="Chat widget"
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: "400px",
        height: "600px",
        maxWidth: "100vw",
        maxHeight: "100vh",
        border: "0",
        zIndex: 9998,
        background: "transparent",
        colorScheme: "normal",
      }}
    />
  );
}
