import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteRole } from "@/lib/permissions";
import { EditorClient } from "@/components/editor/EditorClient";
import { TemplateTargetingPanel } from "@/components/dashboard/TemplateTargetingPanel";
import { PopupTriggerPanel } from "@/components/dashboard/PopupTriggerPanel";
import type { PageContent } from "@/components/blocks/types";
import type { Condition } from "@/lib/condition";
import { defaultPopupSettings, type PopupSettings } from "@/lib/popupTrigger";
import type { TemplateLite } from "@/lib/templates";

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ siteId: string; templateId: string }>;
}) {
  const { siteId, templateId } = await params;
  const session = await auth();
  const template = await db.template.findUnique({ where: { id: templateId } });
  if (!template || template.siteId !== siteId) notFound();

  const role = await getSiteRole(siteId, session!.user.id);
  if (!role) notFound();

  const collections = await db.collection.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });

  // Header/footer Templates preview composed across a representative Page
  // (docs/theme-builder.md "previews live across representative pages")
  // rather than in isolation — see EditorClient's `showComposedPreview`.
  let compositionPage: PageContent | null = null;
  let siteTemplates: TemplateLite[] = [];
  if (template.type === "header" || template.type === "footer") {
    const [samplePage, allTemplates] = await Promise.all([
      db.page.findFirst({ where: { siteId, collectionId: null }, orderBy: [{ isHome: "desc" }, { createdAt: "asc" }] }),
      db.template.findMany({ where: { siteId } }),
    ]);
    compositionPage = (samplePage?.publishedContent ?? samplePage?.draftContent ?? null) as unknown as PageContent | null;
    siteTemplates = allTemplates as unknown as TemplateLite[];
  }

  return (
    <EditorClient
      siteId={siteId}
      pageId={templateId}
      pageTitle={`${template.name} (${template.type})`}
      initialContent={template.content as unknown as PageContent}
      readOnly={role === "VIEWER"}
      mode="template"
      templateType={template.type as "header" | "footer" | "pageTemplate" | "collectionItemTemplate" | "popup"}
      compositionPage={compositionPage}
      siteTemplates={siteTemplates}
      backHref={`/dashboard/sites/${siteId}/templates`}
      extraToolbar={
        <>
          <TemplateTargetingPanel
            siteId={siteId}
            templateId={templateId}
            initialCondition={(template.condition as unknown as Condition) ?? { type: "always" }}
            initialPriority={template.priority}
            collections={collections.map((c) => ({ id: c.id, name: c.name }))}
            readOnly={role === "VIEWER"}
          />
          {template.type === "popup" && (
            <PopupTriggerPanel
              siteId={siteId}
              templateId={templateId}
              initialSettings={(template.trigger as unknown as PopupSettings) ?? defaultPopupSettings()}
              collections={collections.map((c) => ({ id: c.id, name: c.name }))}
              readOnly={role === "VIEWER"}
            />
          )}
        </>
      }
    />
  );
}
