import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteRole } from "@/lib/permissions";
import { CollectionsPanel } from "@/components/dashboard/CollectionsPanel";
import type { CollectionField } from "@/lib/collectionSchema";

export default async function SiteCollectionsPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const session = await auth();
  const site = await db.site.findUnique({ where: { id: siteId } });
  const role = site ? await getSiteRole(siteId, session!.user.id) : null;
  if (!site || !role) notFound();

  const collections = await db.collection.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{site.name} — Collections</h1>
          <p className="text-sm text-gray-500">Typed datasets that power dynamic pages and bound content.</p>
        </div>
        <Link href={`/dashboard/sites/${site.id}`} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
          Back to pages
        </Link>
      </div>
      <CollectionsPanel
        siteId={site.id}
        initialCollections={collections.map((c) => ({
          id: c.id,
          name: c.name,
          fieldSchema: (c.fieldSchema as unknown as CollectionField[]) ?? [],
        }))}
      />
    </div>
  );
}
