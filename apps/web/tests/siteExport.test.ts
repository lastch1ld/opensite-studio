import { describe, expect, it } from "vitest";
import { exportFilename, redactSettings } from "@/lib/siteExport";

describe("redactSettings", () => {
  it("strips the encrypted provider key but keeps everything else", () => {
    const settings = {
      cookieBanner: { enabled: true },
      newsletter: { provider: "webhook", webhookUrl: "https://example.com/hook" },
      aiChat: { provider: "anthropic", model: "claude-opus-5", apiKeyEncrypted: "AAAA-ciphertext" },
    };
    const out = redactSettings(settings) as Record<string, Record<string, unknown>>;
    expect(out.aiChat.apiKeyEncrypted).toBeUndefined();
    // Whether a key is configured is useful to know when reading an export;
    // the key itself is both useless elsewhere (it's sealed with this
    // install's SECRETS_ENCRYPTION_KEY) and dangerous to hand out.
    expect(out.aiChat.hasApiKey).toBe(true);
    expect(out.aiChat.model).toBe("claude-opus-5");
    expect(out.cookieBanner).toEqual({ enabled: true });
    expect(out.newsletter).toEqual({ provider: "webhook", webhookUrl: "https://example.com/hook" });
  });

  it("never leaves a ciphertext anywhere in the document", () => {
    const out = JSON.stringify(redactSettings({ aiChat: { apiKeyEncrypted: "SEALED-SECRET" } }));
    expect(out).not.toContain("SEALED-SECRET");
    expect(out).not.toContain("apiKeyEncrypted");
  });

  it("reports no configured key when there isn't one", () => {
    const out = redactSettings({ aiChat: { provider: "anthropic" } }) as Record<string, Record<string, unknown>>;
    expect(out.aiChat.hasApiKey).toBe(false);
  });

  it("passes through empty and non-object settings unchanged", () => {
    expect(redactSettings(null)).toBeNull();
    expect(redactSettings(undefined)).toBeNull();
    expect(redactSettings({})).toEqual({});
    expect(redactSettings({ aiChat: null })).toEqual({ aiChat: null });
  });
});

describe("exportFilename", () => {
  it("is dated so successive exports don't collide", () => {
    expect(exportFilename("my-site", new Date("2026-08-28T10:00:00Z"))).toBe("my-site-2026-08-28.opensite.json");
  });
});
