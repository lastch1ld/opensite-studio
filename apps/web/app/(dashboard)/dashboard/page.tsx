import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SiteList } from "@/components/dashboard/SiteList";

export default async function DashboardPage() {
  const session = await auth();
  const sites = await db.site.findMany({
    where: { OR: [{ ownerId: session!.user.id }, { memberships: { some: { userId: session!.user.id } } }] },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Your sites</h1>
      <div className="mt-8">
        <SiteList initialSites={sites.map((s) => ({ id: s.id, name: s.name, subdomain: s.subdomain, mode: s.mode }))} />
      </div>
    </div>
  );
}
