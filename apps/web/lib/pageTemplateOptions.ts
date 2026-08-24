// Plain metadata only (no Node built-ins, no Prisma types) so this is safe
// to import from client components — the actual block-tree content
// (lib/pageTemplates.ts) is server-only and pulled in by the API route.
export type PageTemplateOption = { id: string; label: string; description: string };

export const PAGE_TEMPLATES: PageTemplateOption[] = [
  { id: "blank", label: "Blank", description: "Start from a single empty section." },
  { id: "landing", label: "Landing page", description: "A finished hero + features + CTA composition, ready to edit." },
  // docs/starter-templates.md's Aperture port: the "first base pages" a new
  // Site starts from, ported to block-tree JSON instead of the source's
  // MDX/flat-file content model.
  { id: "home", label: "Home page", description: "A hero, a gallery, and a features section — a general-purpose landing page." },
  { id: "blogIndex", label: "Blog index", description: "A page heading plus a list of posts (bind a Collection to it once created)." },
  { id: "blogPost", label: "Blog post", description: "A post hero, body copy, and an image gallery." },
];
