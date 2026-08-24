// Plain metadata only (no Node built-ins) so this is safe to import from
// client components — the actual block-tree content (lib/siteTemplates.ts)
// is server-only, same split as lib/pageTemplateOptions.ts/pageTemplates.ts.
export type SiteTemplatePageOption = { slug: string; title: string; isHome: boolean };

export type SiteTemplateOption = {
  id: string;
  name: string;
  description: string;
  pages: SiteTemplatePageOption[];
};

export const SITE_TEMPLATES: SiteTemplateOption[] = [
  {
    id: "saas",
    name: "SaaS / tech product",
    description: "Home, Features, Pricing, About, Contact — indigo accent, Space Grotesk headings.",
    pages: [
      { slug: "home", title: "Home", isHome: true },
      { slug: "features", title: "Features", isHome: false },
      { slug: "pricing", title: "Pricing", isHome: false },
      { slug: "about", title: "About", isHome: false },
      { slug: "contact", title: "Contact", isHome: false },
    ],
  },
  {
    id: "agency",
    name: "Agency / creative services",
    description: "Home, Work, Services, About, Contact — high-contrast ink + signal-orange, Fraunces headings.",
    pages: [
      { slug: "home", title: "Home", isHome: true },
      { slug: "work", title: "Work", isHome: false },
      { slug: "services", title: "Services", isHome: false },
      { slug: "about", title: "About", isHome: false },
      { slug: "contact", title: "Contact", isHome: false },
    ],
  },
  {
    id: "portfolio",
    name: "Personal portfolio",
    description: "Home, Work, About, Contact — minimal warm-paper palette, deep forest-green accent, Instrument Serif headings.",
    pages: [
      { slug: "home", title: "Home", isHome: true },
      { slug: "work", title: "Work", isHome: false },
      { slug: "about", title: "About", isHome: false },
      { slug: "contact", title: "Contact", isHome: false },
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant",
    description: "Home, Menu, About, Contact — forest green + terracotta, Fraunces headings.",
    pages: [
      { slug: "home", title: "Home", isHome: true },
      { slug: "menu", title: "Menu", isHome: false },
      { slug: "about", title: "About", isHome: false },
      { slug: "contact", title: "Contact", isHome: false },
    ],
  },
  {
    id: "hotel",
    name: "Hotel",
    description: "Home, Rooms, Amenities, Contact & Book — restrained stone/ice palette, Fraunces headings.",
    pages: [
      { slug: "home", title: "Home", isHome: true },
      { slug: "rooms", title: "Rooms", isHome: false },
      { slug: "amenities", title: "Amenities", isHome: false },
      { slug: "contact", title: "Contact & Book", isHome: false },
    ],
  },
];

export function siteTemplateOptionById(id: string): SiteTemplateOption | undefined {
  return SITE_TEMPLATES.find((t) => t.id === id);
}
