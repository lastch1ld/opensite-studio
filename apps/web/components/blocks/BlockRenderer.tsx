"use client";

import { cloneElement, isValidElement, useRef, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { motion, useScroll, useTransform, type Target } from "motion/react";
import type { Block, Breakpoint } from "./types";
import { getBlockDefinition } from "./registry";
import { buildResponsiveCss, columnsResponsiveCss, resolveStyle, resolveTokens, responsiveColumnCount } from "@/lib/responsiveStyle";
import { queryListItems, resolveBoundProps, type RenderContext } from "@/lib/bind";
import { evaluateCondition } from "@/lib/condition";
import { resolveTranslatedProps } from "@/lib/translations";
import type { ThemeTokens } from "@/lib/theme";
import { FilterableItemsGrid, type FilterableGridItem } from "./FilterableItemsGrid";

type BlockRendererProps = {
  block: Block;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  activeBreakpoint?: Breakpoint;
  // Theme to resolve `{ $token: ... }` style values against. Null renders
  // token refs' fallback (undefined -> block's own default) — same path
  // for editor canvas and public renderer, just fed a different theme.
  theme?: ThemeTokens | null;
  // Collection data + current repeater item to resolve `{ $bind: ... }`
  // props and `condition`s against (see lib/bind.ts, lib/condition.ts). If
  // omitted, device is derived from activeBreakpoint and no collection data
  // is available — same as an empty context.
  renderContext?: RenderContext;
  // Editor-only hooks: wrap a block's rendered node (e.g. to add a drag
  // handle) or wrap a container's children (e.g. to interleave drop
  // targets). Public renderer never passes these, so its output is
  // untouched — same render tree, same registry `render()` calls.
  renderNodeWrapper?: (block: Block, node: ReactNode, isRoot: boolean) => ReactNode;
  renderChildrenWrapper?: (container: Block, childNodes: ReactNode[], childBlocks: Block[]) => ReactNode;
  isRoot?: boolean;
};

function deviceFor(breakpoint: Breakpoint): RenderContext["device"] {
  return breakpoint === "base" ? "desktop" : breakpoint;
}

// Scroll-in animation (components/blocks/registry.tsx's shared
// `ANIMATION_FIELD`, appended to every built-in block's inspector)
// resolved here once, generically, rather than per block-type — so any
// block, built-in or plugin-authored, gets the same motion.dev-powered
// options for free the moment its style carries an `animation` key.
// `viewport={{ once: true }}` means it plays once when scrolled into
// view, both on the public site and (harmlessly) while previewing in the
// editor canvas, not on every re-render.
const ANIMATION_VARIANTS: Record<string, Target> = {
  "fade-in": { opacity: 0 },
  "slide-up": { opacity: 0, y: 32 },
  "slide-down": { opacity: 0, y: -32 },
  "slide-left": { opacity: 0, x: -32 },
  "slide-right": { opacity: 0, x: 32 },
  "scale-in": { opacity: 0, scale: 0.92 },
};

// docs/reference-sites-plan.md Tier 3's "scroll-scrubbed" mode
// (ANIMATION_MODE_FIELD in registry.tsx): the same variant shape as the
// fire-once path below, but interpolated continuously against the
// element's own scroll progress through a fixed window (its top crossing
// 90% down the viewport to 35% down) instead of animating once via
// `whileInView`. A real component (not a plain function) because
// `useScroll` needs an actual DOM ref to measure against.
function ScrubAnimatedBlock({ variant, children }: { variant: Target; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.35"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [typeof variant.opacity === "number" ? variant.opacity : 1, 1]);
  const x = useTransform(scrollYProgress, [0, 1], [typeof variant.x === "number" ? variant.x : 0, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [typeof variant.y === "number" ? variant.y : 0, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [typeof variant.scale === "number" ? variant.scale : 1, 1]);
  return (
    <motion.div ref={ref} style={{ opacity, x, y, scale, width: "100%", height: "100%" }}>
      {children}
    </motion.div>
  );
}

// A block wrapped in an `animation` value gets an extra motion.div layer
// around its rendered output — purely for the enter transition, never
// meant to change layout. But a plain `width:auto`/`height:auto` div is a
// flex/grid item like any other: under a non-stretch `align-items` (e.g.
// every genre template's centered `bleed()` band), it shrink-wraps to its
// own max-content size instead of filling the container. For a block
// whose own layout depends on getting real width (or, in a `columns` row
// stretched to a fixed height, real height) from its ancestor — a
// `columns`/`contentSwitcher` grid with `1fr` tracks and no in-flow
// content to measure, e.g. an absolutely-positioned image, or an
// `imageOverlay` panel with its `height: 100%` fallback resolving against
// this wrapper's own `auto` height — that collapses whole columns to 0px
// — found live via a genre template's Team section rendering with no
// photo at all, and separately a split-hero visual column rendering at
// 0 height with the animation removed but nothing telling the box to
// fill the space instead. `width`/`height: 100%` make this wrapper
// transparent to layout, matching what happens with no animation set at
// all.
function withAnimation(style: Record<string, unknown>, node: ReactNode): ReactNode {
  const key = typeof style.animation === "string" ? style.animation : "";
  const variant = ANIMATION_VARIANTS[key];
  if (!variant) return node;
  if (style.animationMode === "scrub") {
    return <ScrubAnimatedBlock variant={variant}>{node}</ScrubAnimatedBlock>;
  }
  return (
    <motion.div
      style={{ width: "100%", height: "100%" }}
      initial={variant}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {node}
    </motion.div>
  );
}

// docs/reference-sites-plan.md Tier 3's `sticky` toggle (STICKY_FIELD in
// registry.tsx) — a single `position: sticky` wrapper, applied as the
// outermost layer (outside the selection-outline wrapper too) so the
// whole block, chrome included while editing, pins as one unit.
function withSticky(style: Record<string, unknown>, node: ReactNode): ReactNode {
  if (style.sticky === "fixed-left") {
    // `height: "100vh"` rather than `bottom: 0` — `vh` always resolves
    // against the real browser viewport regardless of which ancestor
    // establishes this fixed element's containing block, whereas
    // `bottom: 0` resolves against that containing block's own height.
    // The editor canvas gives this element a *transformed* (not viewport)
    // containing block — see the comment on the canvas div in
    // EditorClient.tsx — so a `bottom: 0` here stretched the rail to that
    // div's full, unscrolled page height instead of one viewport, spacing
    // out its `justify: "space-between"` nav links across the whole page
    // instead of keeping them compact near the top.
    return <div style={{ position: "fixed", left: 0, top: 0, height: "100vh", zIndex: 20 }}>{node}</div>;
  }
  if (style.sticky !== "true") return node;
  const top = typeof style.stickyOffset === "string" && style.stickyOffset.trim() ? style.stickyOffset : "0px";
  return <div style={{ position: "sticky", top, zIndex: 5 }}>{node}</div>;
}

// Editor canvas and public renderer both call this component with the same
// block tree. `onSelect`/`selectedId` are only passed by the editor, so the
// public renderer gets identical markup with zero selection chrome.
export function BlockRenderer({
  block,
  selectedId,
  onSelect,
  activeBreakpoint = "base",
  theme = null,
  renderContext,
  renderNodeWrapper,
  renderChildrenWrapper,
  isRoot = false,
}: BlockRendererProps) {
  const def = getBlockDefinition<RenderContext>(block.type);
  if (!def) return null;

  const ctx: RenderContext = renderContext ?? { device: deviceFor(activeBreakpoint) };
  if (!evaluateCondition(block.condition, ctx)) return null;

  const childBlocks = block.children ?? [];
  const resolvedStyle = resolveTokens(resolveStyle(block.style, activeBreakpoint), theme);

  // A list/grid block repeats its child subtree once per matched
  // CollectionItem instead of rendering `children` once through the
  // registry's `render()` (docs/collections.md) — bypasses the normal
  // single-pass content build below, but still goes through this same
  // BlockRenderer for every repeated instance (recursive call per item).
  if (block.type === "list") {
    const collectionId = typeof block.props.collectionId === "string" ? block.props.collectionId : "";
    const allItems = ctx.collectionItems?.[collectionId] ?? [];
    const matched = queryListItems(allItems, block.props);
    // With no matched items, still render one empty pass so the template
    // subtree stays visible/selectable in the editor.
    const instances = matched.length ? matched : [null];
    const desktopColumns = Number(typeof block.props.columns === "string" ? block.props.columns : "3") || 3;
    const cssStyle: CSSProperties = {
      display: "grid",
      gridTemplateColumns: `repeat(${responsiveColumnCount(desktopColumns, activeBreakpoint)}, 1fr)`,
      gap: String(resolvedStyle.gap ?? "16px"),
      // Same shrink-to-fit-collapses-to-0 issue as `columns` (registry.tsx)
      // — a grid with no track holding real in-flow intrinsic content can
      // compute 0 width even inside an otherwise definite-width ancestor.
      width: "100%",
    };
    // docs/reference-sites-plan.md Tier 5: an optional client-side tag
    // filter bar (Mosaic's category filter) built from every distinct
    // value of `filterTagField` across the matched items — see
    // FilterableItemsGrid.tsx. Item nodes are built once here regardless
    // of whether the bar renders, so the filterable and plain paths never
    // diverge in what each item actually looks like.
    const filterTagField = typeof block.props.filterTagField === "string" ? block.props.filterTagField : "";
    const isFilterable = Boolean(filterTagField) && matched.length > 0;
    const items: FilterableGridItem[] = instances.map((item, i) => ({
      key: item?.id ?? `empty-${i}`,
      tag: item && filterTagField ? String(item.data?.[filterTagField] ?? "") : "",
      node: (
        <>
          {childBlocks.map((child) => (
            <BlockRenderer
              key={child.id}
              block={child}
              selectedId={selectedId}
              onSelect={onSelect}
              activeBreakpoint={activeBreakpoint}
              theme={theme}
              renderContext={{ ...ctx, currentItem: item ? { collectionId, id: item.id, data: item.data } : null }}
              renderNodeWrapper={renderNodeWrapper}
              renderChildrenWrapper={renderChildrenWrapper}
            />
          ))}
        </>
      ),
    }));
    const grid = isFilterable ? (
      <FilterableItemsGrid blockId={block.id} gridStyle={cssStyle} items={items} />
    ) : (
      <div style={cssStyle} data-block-id={block.id} data-columns-id={block.id}>
        {items.map((it) => (
          <div key={it.key}>{it.node}</div>
        ))}
      </div>
    );
    const content = (
      <>
        {grid}
        <style dangerouslySetInnerHTML={{ __html: columnsResponsiveCss(block.id, desktopColumns) }} />
      </>
    );
    const animatedList = withAnimation(resolvedStyle, content);
    if (!onSelect) return <>{withSticky(resolvedStyle, animatedList)}</>;
    const isSelected = block.id === selectedId;
    // `height: "100%"` alongside `width: "100%"` — this selection-outline
    // wrapper only exists in the editor (public renderer skips it, see
    // `!onSelect` above), so a child relying on a percentage height to fill
    // a `columns` row stretched by CSS Grid's `align-items: stretch` (e.g.
    // imageOverlay's own `height: "100%"` fallback) resolved against this
    // div's `height: auto` and collapsed to 0 — found live as a split-hero
    // visual column rendering full height on the real site but 0px, empty,
    // in the editor canvas.
    const selectionNode = (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect(block.id);
        }}
        style={{ outline: isSelected ? "2px solid #2563eb" : "1px dashed transparent", outlineOffset: "-1px", cursor: "pointer", position: "relative", width: "100%", height: "100%" }}
      >
        {animatedList}
      </div>
    );
    return renderNodeWrapper
      ? renderNodeWrapper(block, withSticky(resolvedStyle, selectionNode), isRoot)
      : withSticky(resolvedStyle, selectionNode);
  }

  const childNodes = childBlocks.map((child, index) => {
    const rendered = (
      <BlockRenderer
        key={child.id}
        block={child}
        selectedId={selectedId}
        onSelect={onSelect}
        activeBreakpoint={activeBreakpoint}
        theme={theme}
        renderContext={ctx}
        renderNodeWrapper={renderNodeWrapper}
        renderChildrenWrapper={renderChildrenWrapper}
      />
    );
    if (index !== 0) return rendered;
    // A full-bleed first child (e.g. "hero") should touch this
    // container's own top edge even though the container has top padding
    // for its other children — cancel just that one gap with a matching
    // negative margin instead of the container losing its padding
    // altogether. The container's padding shorthand always lists its top
    // value first regardless of how many values it has (1/2/3/4-value
    // forms all start with top), so no side-specific parsing is needed.
    if (!getBlockDefinition<RenderContext>(child.type)?.fullBleed) return rendered;
    const paddingTop = String(resolvedStyle.padding ?? "").trim().split(/\s+/)[0];
    if (!paddingTop || paddingTop === "0" || paddingTop === "0px") return rendered;
    return (
      <div key={`${child.id}-fullbleed-offset`} style={{ marginTop: `calc(-1 * ${paddingTop})` }}>
        {rendered}
      </div>
    );
  });

  const childrenContent = block.children
    ? renderChildrenWrapper
      ? renderChildrenWrapper(block, childNodes, childBlocks)
      : childNodes.length
        ? childNodes
        : null
    : null;

  // Only the public renderer (no onSelect) needs generated media-query CSS;
  // the editor just re-renders the resolved style for whichever breakpoint
  // is active, since its canvas isn't a real responsive viewport.
  const responsiveCss = onSelect ? null : buildResponsiveCss(block.id, block.style, theme);

  const boundProps = resolveBoundProps(block.props, ctx);
  // docs/multilingual.md: applies Translation overrides on top of $bind
  // resolution, for whichever of this block type's fields are marked
  // `translatable` — same shared resolve-through-one-function shape as
  // resolveTokens/resolveBind above, a no-op when no locale is active.
  const resolvedProps = resolveTranslatedProps(
    block.props,
    boundProps,
    def.inspector,
    ctx.translations,
    ctx.translationEntity,
    block.id,
  );
  const rawContent = def.render(resolvedProps, resolvedStyle, childrenContent, { blockId: block.id, ctx, breakpoint: activeBreakpoint });
  // Public renderer always tags the root element with its block id (not
  // just when responsive CSS needs it) — popup elementClick triggers
  // (docs/popups-and-modals.md) delegate a click listener off this
  // attribute to find "the button/link block elsewhere on the page".
  const content =
    !onSelect && isValidElement(rawContent)
      ? cloneElement(rawContent as ReactElement<Record<string, unknown>>, { "data-block-id": block.id })
      : rawContent;

  const withCss = responsiveCss ? (
    <>
      {content}
      <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
    </>
  ) : (
    content
  );
  const animated = withAnimation(resolvedStyle, withCss);

  if (!onSelect) return <>{withSticky(resolvedStyle, animated)}</>;

  const isSelected = block.id === selectedId;
  const selectionNode = (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      style={{
        outline: isSelected ? "2px solid #2563eb" : "1px dashed transparent",
        outlineOffset: "-1px",
        cursor: "pointer",
        position: "relative",
        width: "100%",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.outline = "1px dashed #94a3b8";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.outline = "1px dashed transparent";
      }}
    >
      {animated}
    </div>
  );

  return renderNodeWrapper
    ? renderNodeWrapper(block, withSticky(resolvedStyle, selectionNode), isRoot)
    : withSticky(resolvedStyle, selectionNode);
}
