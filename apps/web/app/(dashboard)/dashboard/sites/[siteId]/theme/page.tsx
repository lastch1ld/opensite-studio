import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ThemeEditorClient } from "@/components/dashboard/ThemeEditorClient";
import { CustomFontsPanel } from "@/components/dashboard/CustomFontsPanel";
import { DEFAULT_THEME_TOKENS, type ThemeTokens } from "@/lib/theme";

export default async function SiteThemePage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const session = await auth();
  const site = await db.site.findUnique({ where: { id: siteId } });
  if (!site || site.ownerId !== session!.user.id) notFound();

  const theme = await db.theme.findUnique({ where: { siteId } });

  return (
    <div>
      <h1 className="text-2xl font-semibold">{site.name} — Theme</h1>
      <p className="text-sm text-gray-500">Site-wide tokens. Blocks that reference a token pick up changes here.</p>
      <ThemeEditorClient siteId={siteId} initialTokens={(theme?.tokens as unknown as ThemeTokens) ?? DEFAULT_THEME_TOKENS} />
      <div className="mt-6">
        <CustomFontsPanel siteId={siteId} />
      </div>
    </div>
  );
}
