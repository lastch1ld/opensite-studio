import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteRole } from "@/lib/permissions";
import { SubmissionsPanel } from "@/components/dashboard/SubmissionsPanel";

export default async function PageSubmissionsPage({
  params,
}: {
  params: Promise<{ siteId: string; pageId: string }>;
}) {
  const { siteId, pageId } = await params;
  const session = await auth();
  const site = await db.site.findUnique({ where: { id: siteId } });
  const role = site ? await getSiteRole(siteId, session!.user.id) : null;
  if (!site || !role) notFound();

  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page || page.siteId !== siteId) notFound();

  const submissions = await db.formSubmission.findMany({ where: { pageId }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <Link href={`/dashboard/sites/${siteId}`} className="text-sm text-gray-500 underline">
        &larr; {site.name}
      </Link>
      <div className="mt-2">
        <SubmissionsPanel
          pageTitle={page.title}
          submissions={submissions.map((s) => ({
            id: s.id,
            blockId: s.blockId,
            data: s.data as Record<string, unknown>,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
