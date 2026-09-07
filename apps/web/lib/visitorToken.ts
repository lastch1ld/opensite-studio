import crypto from "crypto";

// The signed-cookie codec behind lib/visitorAuth.ts, kept apart from it so
// it can be tested without pulling in next/headers or a Prisma client — the
// same shape lib/secrets.ts has, and for the same reason.
//
// The payload carries its own expiry. The cookie's `maxAge` is a request to
// the browser and nothing more: a token copied out of one (a shared device,
// a proxy log, an XSS on the site) stays valid for as long as the signature
// verifies, and nothing server-side had an opinion about how long that was.
// An `exp` inside the signed body is the part an attacker can't edit.

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export { MAX_AGE_SECONDS };

export type VisitorTokenPayload = { visitorId: string; siteId: string; exp: number };

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET is not set.");
  return value;
}

function hmac(body: string): string {
  return crypto.createHmac("sha256", secret()).update(body).digest("base64url");
}

export function signVisitorToken(visitorId: string, siteId: string, now: number = Date.now()): string {
  const payload: VisitorTokenPayload = {
    visitorId,
    siteId,
    exp: Math.floor(now / 1000) + MAX_AGE_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${hmac(body)}`;
}

export function verifyVisitorToken(token: string, now: number = Date.now()): VisitorTokenPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = hmac(body);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }

  let payload: Partial<VisitorTokenPayload>;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<VisitorTokenPayload>;
  } catch {
    return null;
  }

  if (typeof payload.visitorId !== "string" || typeof payload.siteId !== "string") return null;

  // A token minted before this field existed has no expiry and would
  // otherwise be valid forever, which is the exact thing being fixed —
  // so it is rejected rather than grandfathered. The cost is that visitors
  // holding one sign in again once.
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return null;
  if (payload.exp * 1000 <= now) return null;

  return payload as VisitorTokenPayload;
}
