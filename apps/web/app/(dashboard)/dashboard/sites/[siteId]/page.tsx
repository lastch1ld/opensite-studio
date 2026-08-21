import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageList } from "@/components/dashboard/PageList";

export default async function SitePagesPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const session = await auth();
  const site = await db.site.findUnique({ where: { id: siteId } });
  if (!site || site.ownerId !== session!.user.id) notFound();

  const pages = await db.page.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{site.name}</h1>
          <p className="text-sm text-gray-500">{site.subdomain}</p>
        </div>
        <Link href={`/dashboard/sites/${site.id}/theme`} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
          Theme
        </Link>
      </div>
      <PageList
        siteId={site.id}
        initialPages={pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, isHome: p.isHome }))}
      />
    </div>
  );
}
