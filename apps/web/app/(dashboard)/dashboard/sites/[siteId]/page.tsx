import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteRole } from "@/lib/permissions";
import { PageList } from "@/components/dashboard/PageList";
import { MembersPanel } from "@/components/dashboard/MembersPanel";
import { ApiKeysPanel } from "@/components/dashboard/ApiKeysPanel";
import { ChromeTabs } from "@/components/dashboard/ChromeTabs";
import { AccessibilityPanel } from "@/components/dashboard/AccessibilityPanel";

const secondaryNav = [
  { slug: "collections", label: "Collections" },
  { slug: "templates", label: "Theme Builder" },
  { slug: "theme", label: "Theme" },
  { slug: "settings", label: "Settings" },
];

export default async function SitePagesPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const session = await auth();
  const site = await db.site.findUnique({ where: { id: siteId } });
  const role = site ? await getSiteRole(siteId, session!.user.id) : null;
  if (!site || !role) notFound();

  const pages = await db.page.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  const collections = await db.collection.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  const invitations = role === "OWNER" ? await db.invitation.findMany({ where: { siteId }, orderBy: { createdAt: "desc" } }) : [];
  const apiKeys = role === "OWNER" ? await db.apiKey.findMany({ where: { siteId }, orderBy: { createdAt: "desc" } }) : [];

  const tabs = [
    {
      value: "pages",
      label: `Pages${pages.length ? ` (${pages.length})` : ""}`,
      content: (
        <PageList
          siteId={site.id}
          initialPages={pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, isHome: p.isHome, collectionId: p.collectionId }))}
          collections={collections.map((c) => ({ id: c.id, name: c.name }))}
        />
      ),
    },
    {
      value: "accessibility",
      label: "Accessibility",
      content: <AccessibilityPanel siteId={site.id} />,
    },
  ];
  if (role === "OWNER") {
    tabs.push({
      value: "members",
      label: "Members",
      content: (
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
      ),
    });
    tabs.push({
      value: "api-keys",
      label: "API keys",
      content: (
        <ApiKeysPanel
          siteId={site.id}
          initialKeys={apiKeys.map((k) => ({
            id: k.id,
            name: k.name,
            keyPrefix: k.keyPrefix,
            scopes: k.scopes,
            createdAt: k.createdAt.toISOString(),
            lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
            revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
          }))}
        />
      ),
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">{site.name}</h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{site.subdomain}</p>
        </div>
        <nav className="flex flex-wrap gap-1.5">
          {secondaryNav.map((item) => (
            <Link key={item.slug} href={`/dashboard/sites/${site.id}/${item.slug}`} className="chrome-btn chrome-btn-secondary">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        <ChromeTabs defaultValue="pages" tabs={tabs} />
      </div>
    </div>
  );
}
