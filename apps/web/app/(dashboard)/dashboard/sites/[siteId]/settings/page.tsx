import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteRole } from "@/lib/permissions";
import { SiteSettingsPanel } from "@/components/dashboard/SiteSettingsPanel";
import {
  defaultCookieBannerSettings,
  defaultNewsletterSettings,
  defaultAiCrawlerSettings,
  defaultChatbotEmbedSettings,
  defaultAiChatSettings,
  redactAiChatSettings,
  type CookieBannerSettings,
  type NewsletterSettings,
  type AiCrawlerSettings,
  type ChatbotEmbedSettings,
  type AiChatSettings,
} from "@/lib/siteSettings";
import { verificationRecordName } from "@/lib/domain";

export default async function SiteSettingsPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const session = await auth();
  const site = await db.site.findUnique({ where: { id: siteId } });
  const role = site ? await getSiteRole(siteId, session!.user.id) : null;
  if (!site || !role) notFound();

  const settings = await db.siteSettings.findUnique({ where: { siteId } });

  return (
    <div>
      <h1 className="text-2xl font-semibold">{site.name} — Settings</h1>
      <p className="text-sm text-gray-500">Cookie banner and newsletter provider configuration.</p>
      <div className="mt-6">
        <SiteSettingsPanel
          siteId={siteId}
          siteMode={site.mode}
          initialCookieBanner={(settings?.cookieBanner as unknown as CookieBannerSettings) ?? defaultCookieBannerSettings()}
          initialNewsletter={(settings?.newsletter as unknown as NewsletterSettings) ?? defaultNewsletterSettings()}
          initialAiCrawlers={(settings?.aiCrawlers as unknown as AiCrawlerSettings) ?? defaultAiCrawlerSettings()}
          initialChatbotEmbed={(settings?.chatbotEmbed as unknown as ChatbotEmbedSettings) ?? defaultChatbotEmbedSettings()}
          initialAiChat={redactAiChatSettings((settings?.aiChat as unknown as AiChatSettings) ?? defaultAiChatSettings())}
          initialCustomDomain={site.customDomain}
          initialDomainVerified={site.customDomainVerified}
          initialVerificationRecord={
            site.customDomain && site.customDomainVerifyToken
              ? { name: verificationRecordName(site.customDomain), type: "TXT", value: site.customDomainVerifyToken }
              : null
          }
          readOnly={role === "VIEWER"}
          isOwner={role === "OWNER"}
        />
      </div>
    </div>
  );
}
