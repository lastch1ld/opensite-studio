import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Session mechanism for AI_CHAT site visitors — deliberately NOT NextAuth.
// docs/ai-mode.md calls this out as the thing that forces "public visitor
// auth", explicitly separate from the CMS author session (auth.md). Rather
// than standing up a second NextAuth instance (multi-tenant, one "provider"
// per Site, session strategy conflicts with the existing Credentials/JWT
// setup in lib/auth.ts), this is a small hand-rolled signed cookie: a JSON
// payload plus an HMAC-SHA256 signature, using the same secret NextAuth
// already requires (NEXTAUTH_SECRET) so no new required env var. Pragmatic
// minimal approach for a first pass, not a general-purpose auth system.

const COOKIE_PREFIX = "opensite_visitor_";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

type VisitorTokenPayload = { visitorId: string; siteId: string };

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET is not set.");
  return value;
}

function sign(payload: VisitorTokenPayload): string {
  const json = JSON.stringify(payload);
  const body = Buffer.from(json, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token: string): VisitorTokenPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as VisitorTokenPayload;
  } catch {
    return null;
  }
}

function cookieName(siteId: string): string {
  return `${COOKIE_PREFIX}${siteId}`;
}

export async function setVisitorSession(siteId: string, visitorId: string) {
  const jar = await cookies();
  jar.set(cookieName(siteId), sign({ visitorId, siteId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearVisitorSession(siteId: string) {
  const jar = await cookies();
  jar.delete(cookieName(siteId));
}

// Works in both Server Components and Route Handlers — next/headers'
// cookies() is readable in both, writable only in the latter (and in
// Server/Route Actions), which matches how setVisitorSession above is used.
export async function getVisitor(siteId: string) {
  const jar = await cookies();
  const token = jar.get(cookieName(siteId))?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload || payload.siteId !== siteId) return null;
  return db.siteVisitor.findUnique({ where: { id: payload.visitorId } });
}
