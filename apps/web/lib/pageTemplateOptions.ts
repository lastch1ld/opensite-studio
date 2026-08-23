// Plain metadata only (no Node built-ins, no Prisma types) so this is safe
// to import from client components — the actual block-tree content
// (lib/pageTemplates.ts) is server-only and pulled in by the API route.
export type PageTemplateOption = { id: string; label: string; description: string };

export const PAGE_TEMPLATES: PageTemplateOption[] = [
  { id: "blank", label: "Blank", description: "Start from a single empty section." },
  { id: "landing", label: "Landing page", description: "A finished hero + features + CTA composition, ready to edit." },
];
