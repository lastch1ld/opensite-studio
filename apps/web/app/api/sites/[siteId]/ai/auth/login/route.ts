import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAiChatSite } from "@/lib/aiChatSite";
import { setVisitorSession } from "@/lib/visitorAuth";

export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const site = await requireAiChatSite(siteId);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { email, password } = await req.json();
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const visitor = await db.siteVisitor.findUnique({ where: { siteId_email: { siteId, email } } });
  if (!visitor || !(await bcrypt.compare(password, visitor.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await setVisitorSession(siteId, visitor.id);
  return NextResponse.json({ id: visitor.id, email: visitor.email, name: visitor.name });
}
