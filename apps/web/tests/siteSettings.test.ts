import { describe, expect, it } from "vitest";
import { sanitizeAnalyticsSettings } from "@/lib/siteSettings";

// The settings API stores `analytics` as an opaque JSON blob, and
// components/AnalyticsScripts.tsx renders two of its fields as executable
// code on every published page — an inline <script> body and a <script
// src>. These are the cases that matter.
describe("sanitizeAnalyticsSettings", () => {
  it("keeps a well-formed configuration intact", () => {
    expect(
      sanitizeAnalyticsSettings({ enabled: true, provider: "ga4", ga4MeasurementId: "G-ABC1234XYZ" }),
    ).toEqual({ enabled: true, provider: "ga4", ga4MeasurementId: "G-ABC1234XYZ" });
  });

  it("drops a measurement id that would break out of the inline script", () => {
    const escaped = sanitizeAnalyticsSettings({
      enabled: true,
      provider: "ga4",
      ga4MeasurementId: "x');alert(document.cookie);//",
    });
    expect(escaped.ga4MeasurementId).toBeUndefined();
  });

  it("drops a umami script url that isn't absolute https", () => {
    for (const url of ["javascript:alert(1)", "http://evil.test/s.js", "//evil.test/s.js", "not a url"]) {
      expect(sanitizeAnalyticsSettings({ provider: "umami", umamiScriptUrl: url }).umamiScriptUrl, url).toBeUndefined();
    }
    expect(
      sanitizeAnalyticsSettings({ provider: "umami", umamiScriptUrl: "https://analytics.example.com/script.js" })
        .umamiScriptUrl,
    ).toBe("https://analytics.example.com/script.js");
  });

  it("falls back to a disabled, provider-less configuration for junk input", () => {
    const off = { enabled: false, provider: "none" };
    expect(sanitizeAnalyticsSettings({ provider: "evil", enabled: "yes" })).toEqual(off);
    expect(sanitizeAnalyticsSettings(null)).toEqual(off);
    expect(sanitizeAnalyticsSettings("nope")).toEqual(off);
  });

  it("leaves the React-escaped attribute fields permissive but bounded", () => {
    // Plausible's data-domain is legitimately a comma-separated list.
    const many = sanitizeAnalyticsSettings({ provider: "plausible", plausibleDomain: "a.example,b.example" });
    expect(many.plausibleDomain).toBe("a.example,b.example");
    expect(
      sanitizeAnalyticsSettings({ provider: "plausible", plausibleDomain: "x".repeat(300) }).plausibleDomain,
    ).toBeUndefined();
  });
});
