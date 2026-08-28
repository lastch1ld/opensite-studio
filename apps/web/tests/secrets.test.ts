import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/secrets";

const KEY = "test-passphrase-for-site-settings-secrets";

describe("secrets", () => {
  beforeEach(() => {
    process.env.SECRETS_ENCRYPTION_KEY = KEY;
  });
  afterEach(() => {
    process.env.SECRETS_ENCRYPTION_KEY = KEY;
  });

  it("round-trips a stored provider key", () => {
    const plaintext = "sk-ant-not-a-real-key";
    expect(decryptSecret(encryptSecret(plaintext))).toBe(plaintext);
  });

  it("produces a different ciphertext each time", () => {
    // Random IV per call: two sites configured with the same API key must
    // not produce identical SiteSettings blobs.
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("rejects a tampered payload", () => {
    // GCM's auth tag is the point of choosing it — a flipped byte in the
    // ciphertext has to fail loudly, not decrypt to garbage.
    const payload = Buffer.from(encryptSecret("secret"), "base64");
    payload[payload.length - 1] ^= 0xff;
    expect(() => decryptSecret(payload.toString("base64"))).toThrow();
  });

  it("cannot be read with a different key", () => {
    const payload = encryptSecret("secret");
    process.env.SECRETS_ENCRYPTION_KEY = "a-different-passphrase";
    expect(() => decryptSecret(payload)).toThrow();
  });

  it("fails closed when the key is not configured", () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;
    expect(() => encryptSecret("secret")).toThrow(/SECRETS_ENCRYPTION_KEY/);
  });
});
