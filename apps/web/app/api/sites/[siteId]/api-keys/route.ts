import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { API_KEY_SCOPES, generateApiKey, isApiKeyScope } from "@/lib/apiAuth";

// API key management is session-auth only (an API key can't mint another
// API key) and OWNER-only: a key is a standing credential with the OWNER's
// full access surface (narrowed only by its own scopes), same sensitivity
// class as deleting the Site or managing Members — auth.md doesn't yet have
// granular EDITOR permissions to delegate this to.

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const keys = await db.apiKey.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
      createdByUserId: true,
    },
  });
  return NextResponse.json(keys);
}

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, scopes } = await req.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const requestedScopes = scopes === undefined ? [...API_KEY_SCOPES] : scopes;
  if (!Array.isArray(requestedScopes) || requestedScopes.length === 0 || !requestedScopes.every(isApiKeyScope)) {
    return NextResponse.json(
      { error: `scopes must be a non-empty array of: ${API_KEY_SCOPES.join(", ")}` },
      { status: 400 },
    );
  }

  const { raw, hashedKey, keyPrefix } = generateApiKey();
  const apiKey = await db.apiKey.create({
    data: {
      siteId,
      createdByUserId: session.user.id,
      name: name.trim(),
      hashedKey,
      keyPrefix,
      scopes: requestedScopes,
    },
  });

  // The raw key is only ever visible in this one response — only its hash is
  // persisted, so there is no "reveal" endpoint later (same UX as a GitHub
  // PAT).
  return NextResponse.json(
    {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
      key: raw,
    },
    { status: 201 },
  );
}
