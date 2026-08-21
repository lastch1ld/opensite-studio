import { NextResponse } from "next/server";
import { clearVisitorSession } from "@/lib/visitorAuth";

export async function POST(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  await clearVisitorSession(siteId);
  return NextResponse.json({ ok: true });
}
