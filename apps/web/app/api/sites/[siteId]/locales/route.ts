import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { setDefaultLocale } from "@/lib/locales";
import { Prisma } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const locales = await db.locale.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(locales);
}

// docs/multilingual.md's Locale table. A Site's very first Locale is always
// forced to be the default (a Site should have exactly one default Locale —
// see schema.prisma's comment on isDefault) regardless of what the request
// asked for; every Locale after that only becomes default if explicitly
// requested, via the same setDefaultLocale transaction PATCH uses.
export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { code, label, isDefault } = await req.json();
  if (typeof code !== "string" || !code.trim() || typeof label !== "string" || !label.trim()) {
    return NextResponse.json({ error: "code and label are required" }, { status: 400 });
  }

  const existingCount = await db.locale.count({ where: { siteId } });
  const shouldBeDefault = existingCount === 0 || Boolean(isDefault);

  try {
    const locale = await db.locale.create({
      data: { siteId, code: code.trim(), label: label.trim(), isDefault: shouldBeDefault && existingCount === 0 },
    });
    if (shouldBeDefault && existingCount > 0) {
      const updated = await setDefaultLocale(siteId, locale.id);
      return NextResponse.json(updated, { status: 201 });
    }
    return NextResponse.json(locale, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "This locale code already exists for this site" }, { status: 409 });
    }
    throw err;
  }
}
