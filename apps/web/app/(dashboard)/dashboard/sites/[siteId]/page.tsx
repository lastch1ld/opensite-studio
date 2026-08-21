import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteRole } from "@/lib/permissions";
import { PageList } from "@/components/dashboard/PageList";
import { MembersPanel } from "@/components/dashboard/MembersPanel";

export default async function SitePagesPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const session = await auth();
  const site = await db.site.findUnique({ where: { id: siteId } });
  const role = site ? await getSiteRole(siteId, session!.user.id) : null;
  if (!site || !role) notFound();

  const pages = await db.page.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  const collections = await db.collection.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  const invitations = role === "OWNER" ? await db.invitation.findMany({ where: { siteId }, orderBy: { createdAt: "desc" } }) : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{site.name}</h1>
          <p className="text-sm text-gray-500">{site.subdomain}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/sites/${site.id}/collections`} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Collections
          </Link>
          <Link href={`/dashboard/sites/${site.id}/templates`} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Theme Builder
          </Link>
          <Link href={`/dashboard/sites/${site.id}/theme`} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Theme
          </Link>
          <Link href={`/dashboard/sites/${site.id}/settings`} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Settings
          </Link>
        </div>
      </div>
      <PageList
        siteId={site.id}
        initialPages={pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, isHome: p.isHome, collectionId: p.collectionId }))}
        collections={collections.map((c) => ({ id: c.id, name: c.name }))}
      />
      {role === "OWNER" && (
        <MembersPanel
          siteId={site.id}
          initialInvitations={invitations.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role,
            token: i.token,
            acceptedAt: i.acceptedAt ? i.acceptedAt.toISOString() : null,
          }))}
        />
      )}
    </div>
  );
}
