"use client";

import { useState } from "react";
import {
  KNOWN_AI_CRAWLERS,
  type AiCrawlerBot,
  type AiCrawlerSettings,
  type ChatbotEmbedSettings,
  type ChatbotProvider,
  type CookieBannerSettings,
  type CookieCategory,
  type NewsletterSettings,
} from "@/lib/siteSettings";

const ALL_CATEGORIES: CookieCategory[] = ["analytics", "marketing"];
const CHATBOT_PROVIDERS: { value: ChatbotProvider; label: string }[] = [
  { value: "custom", label: "Custom snippet" },
  { value: "intercom", label: "Intercom" },
  { value: "crisp", label: "Crisp" },
  { value: "tawkto", label: "Tawk.to" },
];

type VerificationRecord = { name: string; type: "TXT"; value: string } | null;

// Site-level settings panel — first consumer of the shared SiteSettings
// store (docs/integrations.md "Shared plumbing"): cookie-banner config and
// newsletter provider config both save through the same PUT endpoint. The
// custom-domain section below is a separate OWNER-only resource
// (app/api/sites/[siteId]/domain) rather than part of SiteSettings, since
// it's gated more strictly than the OWNER+EDITOR bar the rest of this panel
// uses.
export function SiteSettingsPanel({
  siteId,
  initialCookieBanner,
  initialNewsletter,
  initialAiCrawlers,
  initialChatbotEmbed,
  initialCustomDomain,
  initialDomainVerified,
  initialVerificationRecord,
  readOnly,
  isOwner,
}: {
  siteId: string;
  initialCookieBanner: CookieBannerSettings;
  initialNewsletter: NewsletterSettings;
  initialAiCrawlers: AiCrawlerSettings;
  initialChatbotEmbed: ChatbotEmbedSettings;
  initialCustomDomain: string | null;
  initialDomainVerified: boolean;
  initialVerificationRecord: VerificationRecord;
  readOnly: boolean;
  isOwner: boolean;
}) {
  const [cookieBanner, setCookieBanner] = useState(initialCookieBanner);
  const [newsletter, setNewsletter] = useState(initialNewsletter);
  const [aiCrawlers, setAiCrawlers] = useState(initialAiCrawlers);
  const [chatbotEmbed, setChatbotEmbed] = useState(initialChatbotEmbed);
  const [saving, setSaving] = useState(false);

  const [domainInput, setDomainInput] = useState(initialCustomDomain ?? "");
  const [customDomain, setCustomDomain] = useState(initialCustomDomain);
  const [domainVerified, setDomainVerified] = useState(initialDomainVerified);
  const [verificationRecord, setVerificationRecord] = useState(initialVerificationRecord);
  const [domainSaving, setDomainSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);

  async function save(next: {
    cookieBanner?: CookieBannerSettings;
    newsletter?: NewsletterSettings;
    aiCrawlers?: AiCrawlerSettings;
    chatbotEmbed?: ChatbotEmbedSettings;
  }) {
    if (readOnly) return;
    if (next.cookieBanner) setCookieBanner(next.cookieBanner);
    if (next.newsletter) setNewsletter(next.newsletter);
    if (next.aiCrawlers) setAiCrawlers(next.aiCrawlers);
    if (next.chatbotEmbed) setChatbotEmbed(next.chatbotEmbed);
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

  function toggleAiBot(bot: AiCrawlerBot, checked: boolean) {
    const blockedBots = checked
      ? [...aiCrawlers.blockedBots, bot]
      : aiCrawlers.blockedBots.filter((b) => b !== bot);
    save({ aiCrawlers: { ...aiCrawlers, blockedBots } });
  }

  async function saveDomain() {
    if (!isOwner) return;
    setDomainSaving(true);
    setDomainError(null);
    const res = await fetch(`/api/sites/${siteId}/domain`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customDomain: domainInput.trim() || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDomainError(data.error ?? "Failed to save domain");
    } else {
      setCustomDomain(data.customDomain);
      setDomainVerified(data.verified);
      setVerificationRecord(data.verificationRecord);
    }
    setDomainSaving(false);
  }

  async function verifyDomain() {
    if (!isOwner) return;
    setVerifying(true);
    setDomainError(null);
    const res = await fetch(`/api/sites/${siteId}/domain/verify`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setDomainError(data.error ?? "Verification failed");
    } else {
      setDomainVerified(data.verified);
      if (!data.verified) setDomainError("DNS record not found yet — this can take a few minutes to propagate.");
    }
    setVerifying(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-sm font-semibold text-gray-700">Custom domain</h2>
        <div className="mt-3 flex flex-col gap-3 rounded border p-4">
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Domain
            <input
              type="text"
              disabled={!isOwner}
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="www.example.com"
              className="w-full max-w-md rounded border px-2 py-1 text-sm"
            />
          </label>
          {isOwner && (
            <button
              type="button"
              onClick={saveDomain}
              disabled={domainSaving || domainInput.trim() === (customDomain ?? "")}
              className="w-fit rounded border px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
            >
              {domainSaving ? "Saving..." : "Save domain"}
            </button>
          )}
          {customDomain && (
            <div className="flex flex-col gap-2 text-xs text-gray-600">
              <span>
                Status:{" "}
                <span className={domainVerified ? "font-medium text-green-700" : "font-medium text-amber-700"}>
                  {domainVerified ? "Verified" : "Not verified"}
                </span>
              </span>
              {!domainVerified && verificationRecord && (
                <div className="rounded bg-gray-50 p-2 font-mono">
                  <div>Add this DNS TXT record, then click Verify:</div>
                  <div>Name: {verificationRecord.name}</div>
                  <div>Value: {verificationRecord.value}</div>
                </div>
              )}
              {!domainVerified && isOwner && (
                <button
                  type="button"
                  onClick={verifyDomain}
                  disabled={verifying}
                  className="w-fit rounded border px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                >
                  {verifying ? "Checking..." : "Verify"}
                </button>
              )}
              {domainVerified && (
                <span>Point this domain&rsquo;s DNS (A/CNAME) at your server to serve traffic — see README.md.</span>
              )}
            </div>
          )}
          {domainError && <span className="text-xs text-red-600">{domainError}</span>}
        </div>
      </section>

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
      <section>
        <h2 className="text-sm font-semibold text-gray-700">AI crawler access</h2>
        <p className="mt-1 text-xs text-gray-500">
          Controls whether GEO crawlers (GPTBot, ClaudeBot, PerplexityBot, ...) can access this site, via robots.txt.
        </p>
        <div className="mt-3 flex flex-col gap-3 rounded border p-4">
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Mode
            <select
              disabled={readOnly}
              value={aiCrawlers.mode}
              onChange={(e) => save({ aiCrawlers: { ...aiCrawlers, mode: e.target.value as AiCrawlerSettings["mode"] } })}
              className="w-full max-w-xs rounded border px-2 py-1 text-sm"
            >
              <option value="allowAll">Allow all AI crawlers</option>
              <option value="blockAll">Block all known AI crawlers</option>
              <option value="custom">Block specific bots</option>
            </select>
          </label>
          {aiCrawlers.mode === "custom" && (
            <div className="flex flex-wrap gap-4">
              {KNOWN_AI_CRAWLERS.map((bot) => (
                <label key={bot} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={aiCrawlers.blockedBots.includes(bot)}
                    onChange={(e) => toggleAiBot(bot, e.target.checked)}
                  />
                  {bot}
                </label>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700">Chatbot embed</h2>
        <p className="mt-1 text-xs text-gray-500">
          Paste a third-party chat widget snippet (Intercom, Crisp, Tawk.to, or your own). Runs sandboxed, same as the
          Embed block, and only loads after the visitor grants marketing cookie consent (if the cookie banner is on).
        </p>
        <div className="mt-3 flex flex-col gap-3 rounded border p-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={chatbotEmbed.enabled}
              onChange={(e) => save({ chatbotEmbed: { ...chatbotEmbed, enabled: e.target.checked } })}
            />
            Show a chat widget on this site
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Provider
            <select
              disabled={readOnly}
              value={chatbotEmbed.provider}
              onChange={(e) => save({ chatbotEmbed: { ...chatbotEmbed, provider: e.target.value as ChatbotProvider } })}
              className="w-full max-w-xs rounded border px-2 py-1 text-sm"
            >
              {CHATBOT_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Embed snippet (HTML/script)
            <textarea
              disabled={readOnly}
              value={chatbotEmbed.snippet}
              onChange={(e) => save({ chatbotEmbed: { ...chatbotEmbed, snippet: e.target.value } })}
              placeholder="<script>...</script>"
              rows={5}
              className="w-full max-w-md rounded border px-2 py-1 font-mono text-xs"
            />
          </label>
        </div>
      </section>
      {saving && <span className="text-xs text-gray-400">Saving...</span>}
    </div>
  );
}
