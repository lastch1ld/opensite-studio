import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { MAX_AGE_SECONDS, signVisitorToken, verifyVisitorToken } from "@/lib/visitorToken";

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

function cookieName(siteId: string): string {
  return `${COOKIE_PREFIX}${siteId}`;
}

export async function setVisitorSession(siteId: string, visitorId: string) {
  const jar = await cookies();
  jar.set(cookieName(siteId), signVisitorToken(visitorId, siteId), {
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
  const payload = verifyVisitorToken(token);
  if (!payload || payload.siteId !== siteId) return null;
  return db.siteVisitor.findUnique({ where: { id: payload.visitorId } });
}
