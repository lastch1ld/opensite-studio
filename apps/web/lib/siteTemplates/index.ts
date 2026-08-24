import type { PageContent } from "@/components/blocks/types";
import { saasHomeTemplate, saasFeaturesTemplate, saasPricingTemplate, saasAboutTemplate, saasContactTemplate } from "./saas";
import { agencyHomeTemplate, agencyWorkTemplate, agencyServicesTemplate, agencyAboutTemplate, agencyContactTemplate } from "./agency";
import { portfolioHomeTemplate, portfolioWorkTemplate, portfolioAboutTemplate, portfolioContactTemplate } from "./portfolio";
import { hotelHomeTemplate, hotelRoomsTemplate, hotelAmenitiesTemplate, hotelContactTemplate } from "./hotel";

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
  if (templateId === "agency") {
    switch (slug) {
      case "home":
        return agencyHomeTemplate();
      case "work":
        return agencyWorkTemplate();
      case "services":
        return agencyServicesTemplate();
      case "about":
        return agencyAboutTemplate();
      case "contact":
        return agencyContactTemplate();
      default:
        return null;
    }
  }
  if (templateId === "portfolio") {
    switch (slug) {
      case "home":
        return portfolioHomeTemplate();
      case "work":
        return portfolioWorkTemplate();
      case "about":
        return portfolioAboutTemplate();
      case "contact":
        return portfolioContactTemplate();
      default:
        return null;
    }
  }
  if (templateId === "hotel") {
    switch (slug) {
      case "home":
        return hotelHomeTemplate();
      case "rooms":
        return hotelRoomsTemplate();
      case "amenities":
        return hotelAmenitiesTemplate();
      case "contact":
        return hotelContactTemplate();
      default:
        return null;
    }
  }
  return null;
}
