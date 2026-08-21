import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteRole } from "@/lib/permissions";
import { TemplatesPanel } from "@/components/dashboard/TemplatesPanel";

export default async function SiteTemplatesPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const session = await auth();
  const site = await db.site.findUnique({ where: { id: siteId } });
  const role = site ? await getSiteRole(siteId, session!.user.id) : null;
  if (!site || !role) notFound();

  const templates = await db.template.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{site.name} — Theme Builder</h1>
          <p className="text-sm text-gray-500">Site-wide header, footer, and page-type templates with targeting rules.</p>
        </div>
        <Link href={`/dashboard/sites/${site.id}`} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
          Back to pages
        </Link>
      </div>
      <TemplatesPanel
        siteId={site.id}
        initialTemplates={templates.map((t) => ({ id: t.id, name: t.name, type: t.type }))}
      />
    </div>
  );
}
