import { beforeEach, describe, expect, it } from "vitest";
import crypto from "crypto";
import { MAX_AGE_SECONDS, signVisitorToken, verifyVisitorToken } from "@/lib/visitorToken";

const SECRET = "test-nextauth-secret-for-visitor-tokens";
const NOW = Date.UTC(2026, 8, 3, 12, 0, 0);

// Mints a token the way the old code did — a signed payload with no `exp`.
function legacyToken(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

describe("visitor tokens", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = SECRET;
  });

  it("round-trips a visitor and its site", () => {
    const token = signVisitorToken("visitor_1", "site_1", NOW);
    expect(verifyVisitorToken(token, NOW)).toEqual({
      visitorId: "visitor_1",
      siteId: "site_1",
      exp: Math.floor(NOW / 1000) + MAX_AGE_SECONDS,
    });
  });

  it("rejects a tampered payload", () => {
    const token = signVisitorToken("visitor_1", "site_1", NOW);
    const [body, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ visitorId: "visitor_2", siteId: "site_1", exp: 9e9 }),
      "utf8",
    ).toString("base64url");
    expect(verifyVisitorToken(`${forged}.${sig}`, NOW)).toBeNull();
    expect(verifyVisitorToken(`${body}.${sig}x`, NOW)).toBeNull();
    expect(verifyVisitorToken("not-a-token", NOW)).toBeNull();
  });

  it("rejects a token past its expiry", () => {
    const token = signVisitorToken("visitor_1", "site_1", NOW);
    const oneSecondBefore = NOW + MAX_AGE_SECONDS * 1000 - 1000;
    expect(verifyVisitorToken(token, oneSecondBefore)).not.toBeNull();
    expect(verifyVisitorToken(token, NOW + MAX_AGE_SECONDS * 1000)).toBeNull();
    expect(verifyVisitorToken(token, NOW + MAX_AGE_SECONDS * 1000 + 1)).toBeNull();
  });

  it("rejects a correctly signed token that carries no expiry", () => {
    // The whole point of the change: these verified forever. A valid
    // signature is not enough on its own.
    expect(legacyToken({ visitorId: "visitor_1", siteId: "site_1" }).split(".").length).toBe(2);
    expect(verifyVisitorToken(legacyToken({ visitorId: "visitor_1", siteId: "site_1" }), NOW)).toBeNull();
    expect(verifyVisitorToken(legacyToken({ visitorId: "v", siteId: "s", exp: "9e9" }), NOW)).toBeNull();
    expect(verifyVisitorToken(legacyToken({ visitorId: "v", siteId: "s", exp: Infinity }), NOW)).toBeNull();
  });
});
