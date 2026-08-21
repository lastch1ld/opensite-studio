import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import { emptyPageContent } from "@/lib/pageContent";
import { defaultPopupSettings } from "@/lib/popupTrigger";
import type { Prisma, TemplateType } from "@prisma/client";

const TEMPLATE_TYPES: TemplateType[] = ["header", "footer", "pageTemplate", "collectionItemTemplate", "popup"];

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const templates = await db.template.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(templates);
}

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, type } = await req.json();
  if (typeof name !== "string" || !name.trim() || !TEMPLATE_TYPES.includes(type)) {
    return NextResponse.json({ error: "name and a valid type are required" }, { status: 400 });
  }

  const template = await db.template.create({
    data: {
      siteId,
      name: name.trim(),
      type: type as TemplateType,
      content: emptyPageContent() as unknown as Prisma.InputJsonValue,
      condition: { type: "always" } as Prisma.InputJsonValue,
      trigger: type === "popup" ? (defaultPopupSettings() as unknown as Prisma.InputJsonValue) : undefined,
    },
  });
  return NextResponse.json(template, { status: 201 });
}
