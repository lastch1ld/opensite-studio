import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSiteRole } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

async function requireTemplate(siteId: string, templateId: string) {
  const template = await db.template.findUnique({ where: { id: templateId } });
  if (!template || template.siteId !== siteId) return null;
  return template;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteId: string; templateId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, templateId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR", "VIEWER"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const template = await requireTemplate(siteId, templateId);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(template);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ siteId: string; templateId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, templateId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const template = await requireTemplate(siteId, templateId);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, content, condition, trigger, priority } = await req.json();
  const data: Prisma.TemplateUpdateInput = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    data.name = name.trim();
  }
  if (content !== undefined) data.content = content as Prisma.InputJsonValue;
  if (condition !== undefined) data.condition = condition as Prisma.InputJsonValue;
  if (trigger !== undefined) data.trigger = trigger as Prisma.InputJsonValue;
  if (priority !== undefined) {
    if (typeof priority !== "number") return NextResponse.json({ error: "priority must be a number" }, { status: 400 });
    data.priority = priority;
  }

  const updated = await db.template.update({ where: { id: templateId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ siteId: string; templateId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, templateId } = await params;
  const site = await requireSiteRole(siteId, session.user.id, ["OWNER", "EDITOR"]);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const template = await requireTemplate(siteId, templateId);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.template.delete({ where: { id: templateId } });
  return NextResponse.json({ ok: true });
}
