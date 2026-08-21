"use client";

import { useState } from "react";
import type { CookieBannerSettings } from "@/lib/siteSettings";
import { getConsent, setConsent, type ConsentState } from "@/lib/cookieConsent";

// Cross-cutting, site-wide injection — same layer as the `<head>` SEO tags,
// not a page block — mounted once from PublishedPage.tsx alongside PopupHost
// (docs/integrations.md "Renderer injects the consent banner site-wide...
// same layer as `<head>` meta tags").
export function CookieBanner({ settings }: { settings: CookieBannerSettings }) {
  // Lazy initializer (not an effect) since localStorage is only readable
  // client-side — the server render and the pre-hydration client render
  // both see `enabled` false/true consistently via `settings`, only the
  // localStorage-derived visibility can differ, same class of client-only
  // state as PopupHost's dismissal tracking.
  const [visible, setVisible] = useState(() => settings.enabled && getConsent() === null);
  const [choices, setChoices] = useState<ConsentState>({});

  if (!settings.enabled || !visible) return null;

  function acceptAll() {
    const state: ConsentState = {};
    for (const c of settings.categories) state[c] = true;
    setConsent(state);
    setVisible(false);
  }

  function decline() {
    setConsent({});
    setVisible(false);
  }

  function saveChoices() {
    setConsent(choices);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        background: "#111",
        color: "#fff",
        padding: "16px 24px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px",
        fontSize: "14px",
      }}
    >
      <p style={{ margin: 0, flex: "1 1 260px" }}>
        This site uses cookies.{" "}
        {settings.policyUrl && (
          <a href={settings.policyUrl} style={{ color: "#fff", textDecoration: "underline" }}>
            Learn more
          </a>
        )}
      </p>
      {settings.categories.length > 0 && (
        <div style={{ display: "flex", gap: "10px" }}>
          {settings.categories.map((category) => (
            <label key={category} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <input
                type="checkbox"
                checked={Boolean(choices[category])}
                onChange={(e) => setChoices((prev) => ({ ...prev, [category]: e.target.checked }))}
              />
              {category}
            </label>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "8px" }}>
        {settings.categories.length > 0 && (
          <button
            onClick={saveChoices}
            style={{ padding: "8px 14px", borderRadius: "4px", border: "1px solid #fff", background: "transparent", color: "#fff" }}
          >
            Save choices
          </button>
        )}
        <button onClick={decline} style={{ padding: "8px 14px", borderRadius: "4px", border: "1px solid #fff", background: "transparent", color: "#fff" }}>
          Decline
        </button>
        <button onClick={acceptAll} style={{ padding: "8px 14px", borderRadius: "4px", border: "none", background: "#fff", color: "#111" }}>
          Accept all
        </button>
      </div>
    </div>
  );
}
