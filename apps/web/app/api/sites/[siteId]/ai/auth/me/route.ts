import { NextResponse } from "next/server";
import { getVisitor } from "@/lib/visitorAuth";

export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const visitor = await getVisitor(siteId);
  if (!visitor) return NextResponse.json({ visitor: null });
  return NextResponse.json({ visitor: { id: visitor.id, email: visitor.email, name: visitor.name } });
}
