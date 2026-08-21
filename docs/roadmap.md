# Roadmap

## Phase 0 — MVP (this pass)

Minimal end-to-end slice proving the core loop: sign up → create a site →
edit a page live → publish → view it publicly.

- [ ] Repo scaffold: Next.js app, Prisma schema, Docker Compose (deployment.md)
- [ ] Auth: credentials login/signup, session, route protection (auth.md)
- [ ] Data model: User/Site/Page + NextAuth tables (data-model.md)
- [ ] Dashboard: list/create/delete sites and pages
- [ ] Block registry with 4 block types: section, text, image, button (blocks-and-theming.md)
- [ ] Editor: canvas + layers + inspector + add/select/delete + autosave (editor.md)
- [ ] Publish action (draftContent → publishedContent)
- [ ] Public renderer: host+slug resolution, render published content (renderer.md)

Explicitly deferred out of Phase 0: drag-and-drop reordering, media
uploads, theming, all of integrations.md, all of
plugins-and-extensibility.md, custom domains, revisions/version history.

## Phase 1 — Usable editor

- Drag-and-drop (add + reorder + reparent)
- Media library + image uploads (media.md)
- Undo/redo
- Responsive breakpoint editing
- More block types (heading, spacer, columns, embed)

## Phase 2 — Real theming + collaboration

- Theme tokens + theme editor panel (blocks-and-theming.md)
- Membership roles (OWNER/EDITOR/VIEWER) + invites (auth.md)
- Revision history + restore (data-model.md)
- Saved/reusable blocks

## Phase 3 — Parity features

- Forms block + submissions
- SEO fields + sitemap/robots (integrations.md)
- Cookie banner + consent gating (integrations.md)
- Newsletter block + provider adapters (integrations.md)
- Custom domains + TLS (renderer.md, deployment.md)

## Phase 4 — Ecosystem

- GEO optimizations (llms.txt, AI-crawler controls) (integrations.md)
- Chatbot embed integrations (integrations.md)
- AI Mode: full-page Claude/ChatGPT-style chat app, server-side keys, instance whitelabeling (ai-mode.md)
- Plugin/block SDK (plugins-and-extensibility.md)
- Multi-language sites

Phases are a sequencing guide, not a commitment to build every item —
re-prioritize freely as real usage surfaces what matters.
