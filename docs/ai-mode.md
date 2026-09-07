# AI Mode (Full-Page Chat App) & Whitelabeling

Built. Shares the secrets-storage and script-injection plumbing with
integrations.md, which is why it was documented before it was built.

## Also here: AI site generation

A second, unrelated use of the same plumbing, built 2026-08-28: "describe
your business, get a site". `POST /api/sites/[siteId]/generate` creates
every page of a genre template and fills its placeholder copy with copy
written for that business.

**The model does not emit block trees.** Asking an LLM for structured page
JSON produces invalid trees, unregistered block types and broken bindings
often enough that the failure mode is a broken site. Structure comes from
the six hand-built, contrast-audited genre templates
(docs/site-templates-plan.md); the model only writes words. It therefore
cannot produce anything the block system can't render, and every generated
site inherits the accessibility and design work already done.

The slots are the templates' own "Replace with a features-page headline"
placeholders — text written to tell a human what belongs there, which
turns out to work just as well on a model. See `lib/aiGenerate.ts`. A
malformed reply, an invented slot id, or a failed call all degrade to
"that slot kept its placeholder", never to a corrupt page, and copy
someone has already edited is never overwritten.

Key resolution: the site's own configured provider key if it has one,
otherwise the server's `ANTHROPIC_API_KEY`.

## What it is

Not an embeddable widget on a page — a standalone, full-page chat
application, the same shape as claude.ai or chatgpt.com, that this app can
stand up at its own route/site. A site in this system can be flagged as
"AI Mode" instead of a normal block-based page site: instead of a page
builder, that site *is* a chat app (conversation list sidebar, message
thread, composer), reusing this project's existing auth (auth.md — the
chat app's own visitor/user accounts) and Site concept (data-model.md) for
tenancy, rather than being a block rendered inside a page.

The model provider API key **only ever lives server-side**. The browser
never sees it; every request goes through this app's own API route, which
attaches the key and proxies to the provider.

## Built

- **`Site.mode` field**: `"BUILDER"` (default, today's block-based site) or
  `"AI_CHAT"`. An AI_CHAT site skips the page/block system entirely —
  renderer.md's routing resolves host → Site as usual, but then hands off
  to the chat app shell instead of the block renderer.
- **Site-level AI settings**: provider (Anthropic/OpenAI/other
  OpenAI-compatible endpoint), API key, default model, system
  prompt/persona. Stored in the same `SiteSettings` secrets store proposed
  in integrations.md — encrypted at rest, never returned to the client in
  any API response (write-only field from the client's perspective).
- **Chat proxy API route** (`/api/ai/chat`): accepts `{ siteId,
  conversationId, messages }`, loads the site's key server-side, calls the
  provider, streams the response back (SSE or `ReadableStream`).
  Per-site/per-user rate limiting is required before this is safe to
  expose publicly — an unmetered proxy in front of someone's paid API key
  is a cost-abuse vector.
- **Full chat UI** at the AI_CHAT site's public route: sidebar with
  conversation list (new chat, rename, delete), message thread with
  markdown rendering, streaming response display, composer. This is the
  entire page, not a component dropped into one.
- **Conversation persistence** — `AiConversation`/`AiMessage` tables,
  scoped to the visitor's account on that site (reuses auth.md's session
  model; an AI_CHAT site needs visitor-level login, distinct from the CMS
  author login, similar in kind to the "public visitor auth" item already
  flagged as deferred in auth.md — this feature is what actually forces
  that to get built, rather than the generic Members Area case).

## Needed for full parity `[ ]`

- **Multi-provider abstraction** — one internal interface, adapters for
  Anthropic, OpenAI, and generic OpenAI-compatible endpoints (Ollama,
  local models, etc.) so self-hosters aren't locked to one vendor.
- **Per-conversation context/tools** — e.g. grounding the assistant in the
  site's own page content (basic RAG over published pages) so it can
  answer visitor questions about the site itself, not just be a generic
  chatbot. Meaningfully larger scope than the base chat app — own future
  slice if pursued.
- **Usage/cost visibility** — token usage tracking per site so an owner
  can see what their configured key is costing them through this feature.
- **Abuse controls** beyond basic rate limiting — per-IP throttling,
  optional CAPTCHA/turnstile gate on signup/chat, max conversation length.
- **File/image attachments** in messages, matching Claude/ChatGPT-style
  chat apps — needs the media pipeline (media.md) reused here.

## Whitelabeling

Two distinct things get bundled under "whitelabeling" — keep them
separate:

1. **Published-site whitelabeling** (should already be close to free): the
   public renderer (renderer.md) never puts "Built with OpenSite Studio"
   branding on a published site by default, since this is self-hosted OSS,
   not a freemium SaaS forcing an upsell badge. Nothing to build here
   beyond *not adding* such a badge — worth stating explicitly so it isn't
   accidentally added later while building integrations.md's script
   injection point.
2. **CMS-chrome whitelabeling** — letting an operator who self-hosts this
   for their own clients rebrand the dashboard/editor/login screens
   themselves (product name, logo, favicon, accent color, optionally the
   AI Mode chat app's default persona/name). This is real scope:
   - Instance-level settings (not per-site): app name, logo URL, favicon,
     primary color — read from env vars or a single `AppSettings` row at
     minimum for the MVP-of-this-feature, applied to the dashboard shell,
     login/signup pages, and email templates (auth.md).
   - Explicitly NOT per-site white-labeling of the dashboard (a given
     self-hosted instance has one operator identity); per-site branding of
     the *published* site itself is already covered by point 1 plus normal
     theming (blocks-and-theming.md) — no extra work needed there.

## Shared plumbing this implies

- Extends the `SiteSettings`/secrets store proposed in integrations.md
  (AI provider key sits alongside newsletter provider keys, same
  encryption-at-rest requirement).
- New instance-level `AppSettings` concept (whitelabeling) — the first
  thing in this codebase that isn't scoped to a Site; call this out
  explicitly when it's built since every other settings surface so far is
  per-site.
- AI_CHAT sites reuse the existing Site/renderer routing (renderer.md) for
  host/tenancy resolution, and reuse the auth session model (auth.md) for
  the chat app's own visitor accounts — no separate infra needed for
  either, just a mode branch at the routing layer.
