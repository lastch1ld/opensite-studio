"use client";

import { useEffect, useState } from "react";
import type { AnalyticsSettings, CookieBannerSettings } from "@/lib/siteSettings";
import { hasConsent, CONSENT_CHANGE_EVENT } from "@/lib/cookieConsent";

// Cross-cutting, site-wide injection mounted from PublishedPage.tsx
// alongside ChatbotEmbed/CookieBanner (docs/starter-templates.md's Aperture
// port of the source's analytics adapters — Plausible/GA4/Umami, config'd
// site-level via SiteSettings.analytics, same "shared plumbing" pattern as
// every other integration in lib/siteSettings.ts). Analytics scripts are
// the site owner's own trusted config (not third-party pasted HTML like
// ChatbotEmbed's snippet), so they load as plain `<script>` tags rather than
// a sandboxed iframe — gated by the "analytics" cookie category, mirroring
// ChatbotEmbed's "marketing"-gated pattern exactly.
export function AnalyticsScripts({
  settings,
  cookieBannerSettings,
}: {
  settings: AnalyticsSettings;
  cookieBannerSettings: CookieBannerSettings;
}) {
  const [allowed, setAllowed] = useState(() => !cookieBannerSettings.enabled || hasConsent("analytics"));

  useEffect(() => {
    if (!cookieBannerSettings.enabled) return;
    const onConsent = () => setAllowed(hasConsent("analytics"));
    window.addEventListener(CONSENT_CHANGE_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onConsent);
  }, [cookieBannerSettings.enabled]);

  if (!settings.enabled || settings.provider === "none" || !allowed) return null;

  if (settings.provider === "plausible" && settings.plausibleDomain) {
    return <script defer data-domain={settings.plausibleDomain} src="https://plausible.io/js/script.js" />;
  }

  if (settings.provider === "ga4" && settings.ga4MeasurementId) {
    const id = settings.ga4MeasurementId;
    return (
      <>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
        <script
          dangerouslySetInnerHTML={{
            // Belt and braces behind lib/siteSettings.ts's
            // sanitizeAnalyticsSettings: JSON.stringify emits the id as a
            // quoted, escaped JS string literal, so a value that somehow got
            // past validation still can't close the string and become code.
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', ${JSON.stringify(id)});`,
          }}
        />
      </>
    );
  }

  if (settings.provider === "umami" && settings.umamiWebsiteId && settings.umamiScriptUrl) {
    return <script defer data-website-id={settings.umamiWebsiteId} src={settings.umamiScriptUrl} />;
  }

  return null;
}
