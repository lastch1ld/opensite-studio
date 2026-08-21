import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { PageContent } from "@/components/blocks/types";
import type { ThemeTokens } from "@/lib/theme";
import type { RenderContext } from "@/lib/bind";
import type { TemplateLite } from "@/lib/templates";
import { resolveTemplate, resolveTemplates } from "@/lib/templates";
import { PopupHost, type PopupSpec } from "@/components/PopupHost";
import { defaultPopupSettings, type PopupSettings } from "@/lib/popupTrigger";
import { CookieBanner } from "@/components/CookieBanner";
import { defaultCookieBannerSettings, type CookieBannerSettings } from "@/lib/siteSettings";

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
}: {
  content: PageContent | null;
  theme?: ThemeTokens | null;
  templates?: TemplateLite[];
  renderContext?: RenderContext;
  cookieBannerSettings?: CookieBannerSettings | null;
}) {
  const ctx: RenderContext = renderContext ?? { device: "desktop" };

  const header = resolveTemplate(templates, "header", ctx);
  const footer = resolveTemplate(templates, "footer", ctx);
  const bodyTemplateType = ctx.currentItem ? "collectionItemTemplate" : "pageTemplate";
  const bodyTemplate = resolveTemplate(templates, bodyTemplateType, ctx);
  const bodyRoot = bodyTemplate ? (bodyTemplate.content as PageContent).root : content?.root;

  // Popups aren't single-slot like header/footer/pageTemplate — every
  // eligible one mounts, each independently trigger-gated by PopupHost.
  const popups: PopupSpec[] = resolveTemplates(templates, "popup", ctx).map((t) => ({
    id: t.id,
    content: t.content as PageContent,
    settings: (t.trigger as PopupSettings | undefined) ?? defaultPopupSettings(),
  }));

  if (!bodyRoot) {
    return (
      <div style={{ padding: "48px", textAlign: "center", fontFamily: "sans-serif", color: "#666" }}>
        <h1>This site hasn&apos;t been published yet.</h1>
      </div>
    );
  }

  return (
    <>
      {header && <BlockRenderer block={(header.content as PageContent).root} theme={theme} renderContext={ctx} isRoot />}
      <BlockRenderer block={bodyRoot} theme={theme} renderContext={ctx} isRoot />
      {footer && <BlockRenderer block={(footer.content as PageContent).root} theme={theme} renderContext={ctx} isRoot />}
      <PopupHost popups={popups} theme={theme} renderContext={ctx} />
      <CookieBanner settings={cookieBannerSettings ?? defaultCookieBannerSettings()} />
    </>
  );
}
