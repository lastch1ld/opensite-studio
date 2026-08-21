import { notFound } from "next/navigation";
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
      <h1 className="text-2xl font-semibold">{site.name}</h1>
      <p className="text-sm text-gray-500">{site.subdomain}</p>
      <PageList
        siteId={site.id}
        initialPages={pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, isHome: p.isHome }))}
      />
    </div>
  );
}
