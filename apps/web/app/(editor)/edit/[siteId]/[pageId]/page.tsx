import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteRole } from "@/lib/permissions";
import { EditorClient } from "@/components/editor/EditorClient";
import type { PageContent } from "@/components/blocks/types";
import type { PageSeo } from "@/lib/seo";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ siteId: string; pageId: string }>;
}) {
  const { siteId, pageId } = await params;
  const session = await auth();
  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page || page.siteId !== siteId) notFound();

  const role = await getSiteRole(siteId, session!.user.id);
  if (!role) notFound();

  return (
    <EditorClient
      siteId={siteId}
      pageId={pageId}
      pageTitle={page.title}
      initialContent={page.draftContent as unknown as PageContent}
      canPublish={role === "OWNER"}
      readOnly={role === "VIEWER"}
      pageCollectionId={page.collectionId}
      initialSeo={page.seo as PageSeo | null}
    />
  );
}
