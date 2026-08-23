import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { setDefaultLocale } from "@/lib/locales";
import { Prisma } from "@prisma/client";

async function requireLocale(siteId: string, localeId: string) {
  const locale = await db.locale.findUnique({ where: { id: localeId } });
  if (!locale || locale.siteId !== siteId) return null;
  return locale;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ siteId: string; localeId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, localeId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const locale = await requireLocale(siteId, localeId);
  if (!locale) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { code, label, isDefault } = await req.json();

  if (isDefault === false && locale.isDefault) {
    return NextResponse.json(
      { error: "Set another locale as default instead of unsetting this one." },
      { status: 400 },
    );
  }

  const data: Prisma.LocaleUpdateInput = {};
  if (code !== undefined) {
    if (typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "code must be a non-empty string" }, { status: 400 });
    }
    data.code = code.trim();
  }
  if (label !== undefined) {
    if (typeof label !== "string" || !label.trim()) {
      return NextResponse.json({ error: "label must be a non-empty string" }, { status: 400 });
    }
    data.label = label.trim();
  }

  try {
    if (Object.keys(data).length > 0) {
      await db.locale.update({ where: { id: localeId }, data });
    }
    const updated = isDefault === true ? await setDefaultLocale(siteId, localeId) : await db.locale.findUnique({ where: { id: localeId } });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "This locale code already exists for this site" }, { status: 409 });
    }
    throw err;
  }
}

// Deleting the default Locale is only allowed when it's the site's only
// remaining Locale (reverts the site to "multilingual not configured");
// otherwise the caller has to reassign the default first (PATCH
// `{ isDefault: true }` on another Locale) — matches the app-layer
// exactly-one-default invariant this whole feature is built around.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ siteId: string; localeId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, localeId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const locale = await requireLocale(siteId, localeId);
  if (!locale) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (locale.isDefault) {
    const otherCount = await db.locale.count({ where: { siteId, NOT: { id: localeId } } });
    if (otherCount > 0) {
      return NextResponse.json(
        { error: "Reassign the default locale to another one before deleting it." },
        { status: 400 },
      );
    }
  }

  // Cascades the Locale's Translation rows (schema.prisma's onDelete:
  // Cascade) — no separate cleanup step needed.
  await db.locale.delete({ where: { id: localeId } });
  return NextResponse.json({ ok: true });
}
