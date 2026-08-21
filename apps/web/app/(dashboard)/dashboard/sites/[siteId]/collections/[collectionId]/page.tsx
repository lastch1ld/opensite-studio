import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteRole } from "@/lib/permissions";
import { CollectionEditorClient } from "@/components/dashboard/CollectionEditorClient";
import type { CollectionField } from "@/lib/collectionSchema";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ siteId: string; collectionId: string }>;
}) {
  const { siteId, collectionId } = await params;
  const session = await auth();
  const site = await db.site.findUnique({ where: { id: siteId } });
  const role = site ? await getSiteRole(siteId, session!.user.id) : null;
  if (!site || !role) notFound();

  const collection = await db.collection.findUnique({
    where: { id: collectionId },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!collection || collection.siteId !== siteId) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{collection.name}</h1>
        <Link href={`/dashboard/sites/${siteId}/collections`} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
          Back to collections
        </Link>
      </div>
      <CollectionEditorClient
        siteId={siteId}
        collectionId={collection.id}
        initialName={collection.name}
        initialFieldSchema={(collection.fieldSchema as unknown as CollectionField[]) ?? []}
        initialItems={collection.items.map((i) => ({ id: i.id, data: i.data as Record<string, unknown> }))}
      />
    </div>
  );
}
