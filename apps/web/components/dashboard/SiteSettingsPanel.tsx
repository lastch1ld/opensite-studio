"use client";

import { useState } from "react";
import type { CookieBannerSettings, CookieCategory, NewsletterSettings } from "@/lib/siteSettings";

const ALL_CATEGORIES: CookieCategory[] = ["analytics", "marketing"];

// Site-level settings panel — first consumer of the shared SiteSettings
// store (docs/integrations.md "Shared plumbing"): cookie-banner config and
// newsletter provider config both save through the same PUT endpoint.
export function SiteSettingsPanel({
  siteId,
  initialCookieBanner,
  initialNewsletter,
  readOnly,
}: {
  siteId: string;
  initialCookieBanner: CookieBannerSettings;
  initialNewsletter: NewsletterSettings;
  readOnly: boolean;
}) {
  const [cookieBanner, setCookieBanner] = useState(initialCookieBanner);
  const [newsletter, setNewsletter] = useState(initialNewsletter);
  const [saving, setSaving] = useState(false);

  async function save(next: { cookieBanner?: CookieBannerSettings; newsletter?: NewsletterSettings }) {
    if (readOnly) return;
    if (next.cookieBanner) setCookieBanner(next.cookieBanner);
    if (next.newsletter) setNewsletter(next.newsletter);
    setSaving(true);
    await fetch(`/api/sites/${siteId}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
  }

  function toggleCategory(category: CookieCategory, checked: boolean) {
    const categories = checked
      ? [...cookieBanner.categories, category]
      : cookieBanner.categories.filter((c) => c !== category);
    save({ cookieBanner: { ...cookieBanner, categories } });
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-sm font-semibold text-gray-700">Cookie banner</h2>
        <div className="mt-3 flex flex-col gap-3 rounded border p-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={cookieBanner.enabled}
              onChange={(e) => save({ cookieBanner: { ...cookieBanner, enabled: e.target.checked } })}
            />
            Show a cookie consent banner on this site
          </label>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-gray-500">Optional categories:</span>
            {ALL_CATEGORIES.map((category) => (
              <label key={category} className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={cookieBanner.categories.includes(category)}
                  onChange={(e) => toggleCategory(category, e.target.checked)}
                />
                {category}
              </label>
            ))}
          </div>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Privacy/cookie policy link
            <input
              type="url"
              disabled={readOnly}
              value={cookieBanner.policyUrl ?? ""}
              onChange={(e) => save({ cookieBanner: { ...cookieBanner, policyUrl: e.target.value } })}
              placeholder="https://example.com/privacy"
              className="w-full max-w-md rounded border px-2 py-1 text-sm"
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700">Newsletter provider</h2>
        <div className="mt-3 flex flex-col gap-3 rounded border p-4">
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Provider
            <select
              disabled={readOnly}
              value={newsletter.provider}
              onChange={(e) => save({ newsletter: { ...newsletter, provider: e.target.value as NewsletterSettings["provider"] } })}
              className="w-full max-w-xs rounded border px-2 py-1 text-sm"
            >
              <option value="storeOnly">Store submissions only (no provider)</option>
              <option value="webhook">Generic webhook</option>
            </select>
          </label>
          {newsletter.provider === "webhook" && (
            <label className="flex flex-col gap-1 text-xs text-gray-500">
              Webhook URL
              <input
                type="url"
                disabled={readOnly}
                value={newsletter.webhookUrl ?? ""}
                onChange={(e) => save({ newsletter: { ...newsletter, webhookUrl: e.target.value } })}
                placeholder="https://hooks.example.com/newsletter"
                className="w-full max-w-md rounded border px-2 py-1 text-sm"
              />
            </label>
          )}
        </div>
      </section>
      {saving && <span className="text-xs text-gray-400">Saving...</span>}
    </div>
  );
}
