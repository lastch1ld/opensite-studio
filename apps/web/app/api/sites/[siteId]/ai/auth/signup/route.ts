import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAiChatSite } from "@/lib/aiChatSite";
import { setVisitorSession } from "@/lib/visitorAuth";

// Visitor signup for an AI_CHAT site — deliberately separate from
// /api/signup (CMS author accounts), see lib/visitorAuth.ts.
export async function POST(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const site = await requireAiChatSite(siteId);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { email, password, name } = await req.json();
  if (typeof email !== "string" || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Email and a password of at least 8 characters are required." },
      { status: 400 },
    );
  }

  const existing = await db.siteVisitor.findUnique({ where: { siteId_email: { siteId, email } } });
  if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const visitor = await db.siteVisitor.create({
    data: { siteId, email, passwordHash, name: typeof name === "string" && name.trim() ? name.trim() : undefined },
  });
  await setVisitorSession(siteId, visitor.id);
  return NextResponse.json({ id: visitor.id, email: visitor.email, name: visitor.name });
}
