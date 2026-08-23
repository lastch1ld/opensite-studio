import type { PageContent } from "@/components/blocks/types";
import { saasHomeTemplate, saasFeaturesTemplate, saasPricingTemplate, saasAboutTemplate, saasContactTemplate } from "./saas";

// Dispatch — (templateId, slug) -> that page's real content. Slugs here
// must match lib/siteTemplateOptions.ts's SITE_TEMPLATES exactly (that
// file is the client-safe catalog of which pages a template creates; this
// function is where each genre's actual block tree lives). One genre per
// module (./saas.ts, and eventually ./agency.ts, ./portfolio.ts,
// ./restaurant.ts, ./hotel.ts, ./bar.ts — see docs/site-templates-plan.md)
// so each can be authored independently without touching a shared file.
export function siteTemplatePageContent(templateId: string, slug: string): PageContent | null {
  if (templateId === "saas") {
    switch (slug) {
      case "home":
        return saasHomeTemplate();
      case "features":
        return saasFeaturesTemplate();
      case "pricing":
        return saasPricingTemplate();
      case "about":
        return saasAboutTemplate();
      case "contact":
        return saasContactTemplate();
      default:
        return null;
    }
  }
  return null;
}
