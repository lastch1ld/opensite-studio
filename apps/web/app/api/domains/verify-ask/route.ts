import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Caddy on-demand TLS "ask" endpoint (docs/deployment.md "Reverse proxy for
// custom domains + TLS") — Caddy GETs this with ?domain= before issuing a
// cert for a hostname it doesn't already have config for, and only proceeds
// on a 2xx. Intentionally public/unauthenticated (that's the ask contract),
// so the response carries no body and no site details — just allow/deny —
// to avoid turning it into a way to enumerate which domains are registered.
export async function GET(req: Request) {
  const domain = new URL(req.url).searchParams.get("domain")?.trim().toLowerCase();
  if (!domain) return new NextResponse(null, { status: 400 });

  const site = await db.site.findUnique({
    where: { customDomain: domain },
    select: { customDomainVerified: true },
  });

  return new NextResponse(null, { status: site?.customDomainVerified ? 200 : 403 });
}
