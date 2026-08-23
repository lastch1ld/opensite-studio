import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { PageContent } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";
import type { RenderContext } from "@/lib/bind";
import type { TemplateLite } from "@/lib/templates";
import { resolveTemplate, resolveTemplates } from "@/lib/templates";
import { PopupHost, type PopupSpec } from "@/components/PopupHost";
import { defaultPopupSettings, type PopupSettings } from "@/lib/popupTrigger";
import { CookieBanner } from "@/components/CookieBanner";
import { ChatbotEmbed } from "@/components/ChatbotEmbed";
import { CustomFontStyles } from "@/components/CustomFontStyles";
import {
  defaultCookieBannerSettings,
  defaultChatbotEmbedSettings,
  type CookieBannerSettings,
  type ChatbotEmbedSettings,
  type CustomFont,
} from "@/lib/siteSettings";

// Composes header Template + (page content, or a matching pageTemplate /
// collectionItemTemplate's content if one targets this render) + footer
// Template, all through the same shared BlockRenderer (docs/theme-builder.md
// "Renderer resolves ... composed into the final render, still through the
// same shared block-renderer codepath as everything else").
export function PublishedPage({
  content,
  theme = null,
  templates = [],
  renderContext,
  cookieBannerSettings = null,
  chatbotEmbedSettings = null,
  customFonts = [],
}: {
  content: PageContent | null;
  theme?: ThemeTokens | null;
  templates?: TemplateLite[];
  renderContext?: RenderContext;
  cookieBannerSettings?: CookieBannerSettings | null;
  chatbotEmbedSettings?: ChatbotEmbedSettings | null;
  customFonts?: CustomFont[];
}) {
  const ctx: RenderContext = renderContext ?? { device: "desktop" };

  const header = resolveTemplate(templates, "header", ctx);
  const footer = resolveTemplate(templates, "footer", ctx);
  const bodyTemplateType = ctx.currentItem ? "collectionItemTemplate" : "pageTemplate";
  const bodyTemplate = resolveTemplate(templates, bodyTemplateType, ctx);
  const bodyRoot = bodyTemplate ? (bodyTemplate.content as PageContent).root : content?.root;

  // Header/footer/body can each come from a different entity (a Template
  // for header/footer, either the Page itself or a matching pageTemplate/
  // collectionItemTemplate Template for the body) — docs/multilingual.md's
  // Translation rows are keyed per (entityType, entityId), so each slot
  // gets its own `translationEntity` spliced onto the shared base ctx
  // rather than one context serving all three.
  const headerCtx: RenderContext = header ? { ...ctx, translationEntity: { type: "template", id: header.id } } : ctx;
  const footerCtx: RenderContext = footer ? { ...ctx, translationEntity: { type: "template", id: footer.id } } : ctx;
  const bodyCtx: RenderContext = {
    ...ctx,
    translationEntity: bodyTemplate
      ? { type: "template", id: bodyTemplate.id }
      : content
        ? { type: "page", id: ctx.pageId ?? "" }
        : undefined,
  };

  // Popups aren't single-slot like header/footer/pageTemplate — every
  // eligible one mounts, each independently trigger-gated by PopupHost.
  const popups: PopupSpec[] = resolveTemplates(templates, "popup", ctx).map((t) => ({
    id: t.id,
    content: t.content as PageContent,
    settings: (t.trigger as PopupSettings | undefined) ?? defaultPopupSettings(),
    renderContext: { ...ctx, translationEntity: { type: "template", id: t.id } },
  }));

  const resolvedCookieBanner = cookieBannerSettings ?? defaultCookieBannerSettings();

  if (!bodyRoot) {
    return (
      <div style={{ padding: "48px", textAlign: "center", fontFamily: "sans-serif", color: "#666" }}>
        <h1>This site hasn&apos;t been published yet.</h1>
      </div>
    );
  }

  return (
    <>
      <CustomFontStyles fonts={customFonts} />
      {header && <BlockRenderer block={(header.content as PageContent).root} theme={theme} renderContext={headerCtx} isRoot />}
      <BlockRenderer block={bodyRoot} theme={theme} renderContext={bodyCtx} isRoot />
      {footer && <BlockRenderer block={(footer.content as PageContent).root} theme={theme} renderContext={footerCtx} isRoot />}
      <PopupHost popups={popups} theme={theme} renderContext={ctx} />
      <CookieBanner settings={resolvedCookieBanner} />
      <ChatbotEmbed settings={chatbotEmbedSettings ?? defaultChatbotEmbedSettings()} cookieBannerSettings={resolvedCookieBanner} />
    </>
  );
}
