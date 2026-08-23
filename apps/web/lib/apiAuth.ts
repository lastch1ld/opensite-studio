import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Programmatic access (docs/programmatic-access.md): API keys are an
// alternate *authentication* method only. Every route still calls the same
// lib/permissions.ts functions (getSiteRole/requireSiteRole/requirePageRole)
// that session auth uses — this module's job is only to resolve "who is
// making this request" into the same shape session auth already produces
// (a userId), never to duplicate or bypass the role checks themselves.

export const API_KEY_SCOPES = ["read", "write", "publish"] as const;
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export function isApiKeyScope(value: unknown): value is ApiKeyScope {
  return typeof value === "string" && (API_KEY_SCOPES as readonly string[]).includes(value);
}

const KEY_PREFIX = "osk_live_";
const KEY_PREFIX_DISPLAY_LENGTH = KEY_PREFIX.length + 8;

export function generateApiKey(): { raw: string; hashedKey: string; keyPrefix: string } {
  const secret = crypto.randomBytes(24).toString("base64url");
  const raw = `${KEY_PREFIX}${secret}`;
  return { raw, hashedKey: hashApiKey(raw), keyPrefix: raw.slice(0, KEY_PREFIX_DISPLAY_LENGTH) };
}

export function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * The normalized identity of whoever is making a request, regardless of
 * whether they authenticated via NextAuth session or an API key. Route
 * handlers pass `actor.userId` into the existing lib/permissions.ts
 * functions exactly as they already pass `session.user.id` — the actor's
 * role is never trusted directly, it's always re-derived from the current
 * Membership/ownership state by those functions.
 *
 * `scopes: null` means "session auth" — unrestricted, since a human using
 * the dashboard isn't scope-limited. `scopes: ApiKeyScope[]` means an API
 * key authenticated the request and narrows what it may additionally do.
 */
export type RequestActor = {
  userId: string;
  scopes: ApiKeyScope[] | null;
  authMethod: "session" | "apiKey";
  apiKeyId?: string;
};

export function actorHasScope(actor: RequestActor, scope: ApiKeyScope): boolean {
  if (actor.scopes === null) return true;
  return actor.scopes.includes(scope);
}

async function resolveApiKeyActor(request: Request): Promise<{ actor: RequestActor; siteId: string } | null> {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const raw = header.slice("Bearer ".length).trim();
  if (!raw) return null;

  const apiKey = await db.apiKey.findUnique({ where: { hashedKey: hashApiKey(raw) } });
  if (!apiKey || apiKey.revokedAt) return null;

  // Fire-and-forget usage tracking — never block or fail the request on it.
  void db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return {
    siteId: apiKey.siteId,
    actor: {
      userId: apiKey.createdByUserId,
      scopes: apiKey.scopes.filter(isApiKeyScope),
      authMethod: "apiKey",
      apiKeyId: apiKey.id,
    },
  };
}

/**
 * Resolves the actor for a request scoped to a specific Site: tries the
 * NextAuth session first, then falls back to `Authorization: Bearer <key>`.
 * An API key only authenticates requests against the one Site it was
 * created for — a key presented against a different siteId resolves to
 * `null`, same as if no credential had been presented at all.
 */
export async function getRequestActor(request: Request, siteId: string): Promise<RequestActor | null> {
  const session = await auth();
  if (session?.user?.id) return { userId: session.user.id, scopes: null, authMethod: "session" };

  const resolved = await resolveApiKeyActor(request);
  if (!resolved || resolved.siteId !== siteId) return null;
  return resolved.actor;
}

/**
 * Same as `getRequestActor`, but for the one route that isn't nested under
 * `/sites/[siteId]` (`GET /api/sites`) — an API key is still scoped to a
 * single Site, so this also returns that Site's id for the route to filter
 * its response by, rather than trusting a caller-supplied siteId.
 */
export async function getRequestActorAnySite(
  request: Request,
): Promise<{ actor: RequestActor; siteId: string | null } | null> {
  const session = await auth();
  if (session?.user?.id) return { actor: { userId: session.user.id, scopes: null, authMethod: "session" }, siteId: null };

  const resolved = await resolveApiKeyActor(request);
  if (!resolved) return null;
  return resolved;
}
