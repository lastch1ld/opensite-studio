import type { PageContent } from "@/components/blocks/types";
import { saasHomeTemplate, saasFeaturesTemplate, saasPricingTemplate, saasAboutTemplate, saasContactTemplate } from "./saas";
import { agencyHomeTemplate, agencyWorkTemplate, agencyServicesTemplate, agencyAboutTemplate, agencyContactTemplate } from "./agency";
import { portfolioHomeTemplate, portfolioWorkTemplate, portfolioAboutTemplate, portfolioContactTemplate } from "./portfolio";
import { hotelModernHomeTemplate, hotelModernRoomsTemplate, hotelModernAmenitiesTemplate, hotelModernContactTemplate } from "./hotelModern";
import { hotelBoutiqueHomeTemplate, hotelBoutiqueRoomsTemplate, hotelBoutiqueAmenitiesTemplate, hotelBoutiqueContactTemplate } from "./hotelBoutique";
import { hotelResortHomeTemplate, hotelResortRoomsTemplate, hotelResortAmenitiesTemplate, hotelResortContactTemplate } from "./hotelResort";
import { restaurantHomeTemplate, restaurantMenuTemplate, restaurantAboutTemplate, restaurantContactTemplate } from "./restaurant";
import { barHomeTemplate, barMenuTemplate, barEventsTemplate, barContactTemplate } from "./bar";

// Dispatch — (templateId, slug) -> that page's real content. Slugs here
// must match lib/siteTemplateOptions.ts's SITE_TEMPLATES exactly (that
// file is the client-safe catalog of which pages a template creates; this
// function is where each genre's actual block tree lives). One genre per
// module (./saas.ts, and eventually ./agency.ts, ./portfolio.ts,
// ./restaurant.ts, ./hotelModern.ts/./hotelBoutique.ts/./hotelResort.ts,
// ./bar.ts — see docs/site-templates-plan.md) so each can be authored
// independently without touching a shared file. Hotel is three separate
// registers (Modern/Boutique/Resort), not one — see hotelModern.ts's file
// comment for why — retiring the single original hotel.ts.
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
  if (templateId === "hotel-modern") {
    switch (slug) {
      case "home":
        return hotelModernHomeTemplate();
      case "rooms":
        return hotelModernRoomsTemplate();
      case "amenities":
        return hotelModernAmenitiesTemplate();
      case "contact":
        return hotelModernContactTemplate();
      default:
        return null;
    }
  }
  if (templateId === "hotel-boutique") {
    switch (slug) {
      case "home":
        return hotelBoutiqueHomeTemplate();
      case "rooms":
        return hotelBoutiqueRoomsTemplate();
      case "amenities":
        return hotelBoutiqueAmenitiesTemplate();
      case "contact":
        return hotelBoutiqueContactTemplate();
      default:
        return null;
    }
  }
  if (templateId === "hotel-resort") {
    switch (slug) {
      case "home":
        return hotelResortHomeTemplate();
      case "rooms":
        return hotelResortRoomsTemplate();
      case "amenities":
        return hotelResortAmenitiesTemplate();
      case "contact":
        return hotelResortContactTemplate();
      default:
        return null;
    }
  }
  if (templateId === "restaurant") {
    switch (slug) {
      case "home":
        return restaurantHomeTemplate();
      case "menu":
        return restaurantMenuTemplate();
      case "about":
        return restaurantAboutTemplate();
      case "contact":
        return restaurantContactTemplate();
      default:
        return null;
    }
  }
  if (templateId === "bar") {
    switch (slug) {
      case "home":
        return barHomeTemplate();
      case "menu":
        return barMenuTemplate();
      case "events":
        return barEventsTemplate();
      case "contact":
        return barContactTemplate();
      default:
        return null;
    }
  }
  return null;
}
