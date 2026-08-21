export type ContentFragment = {
  id: string;
  semanticType: "heading" | "paragraph" | "listItem" | "quote" | "caption";
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  html?: string; // minimal inline HTML, only <b>/<strong>/<i>/<em>/<a href>
  sourceSection?: string;
};

const SELF_CLOSING = new Set(["br", "img", "hr", "meta", "link", "input", "area", "base", "col", "embed", "source", "track", "wbr"]);

// Removes every element whose tag name is in `tagNames`, or whose opening
// tag's attributes match `classMatch` (best-effort chrome/boilerplate
// filter — cookie banners, ad slots — not a guarantee, see
// docs/content-import.md). Nesting-aware so <nav><nav>...</nav></nav> (or a
// stray tag of the same name inside) doesn't cut the removal short.
function stripElements(html: string, tagNames: Set<string>, classMatch?: RegExp): string {
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
  let result = "";
  let cursor = 0;
  let stripTag: string | null = null;
  let stripDepth = 0;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    const [full, closingSlash, tagRaw, attrs] = match;
    const tag = tagRaw.toLowerCase();
    const isClosing = closingSlash === "/";
    const selfClosing = SELF_CLOSING.has(tag) || /\/\s*>$/.test(full);

    if (stripTag) {
      if (tag === stripTag && !selfClosing) {
        if (isClosing) {
          stripDepth -= 1;
          if (stripDepth === 0) {
            stripTag = null;
            cursor = tagRe.lastIndex;
          }
        } else {
          stripDepth += 1;
        }
      }
      continue;
    }

    if (isClosing) continue;
    const shouldStrip = tagNames.has(tag) || (classMatch ? classMatch.test(attrs) : false);
    if (!shouldStrip) continue;

    result += html.slice(cursor, match.index);
    cursor = tagRe.lastIndex;
    if (!selfClosing) {
      stripTag = tag;
      stripDepth = 1;
    }
  }
  result += html.slice(cursor);
  return result;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? whole : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity] ?? whole;
  });
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

// Keeps only bold/italic/link inline marks; everything else (span wrappers,
// style/class attrs, font tags, etc.) collapses to its text content.
function sanitizeInline(html: string): string {
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
  let out = "";
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    const [, closingSlash, tagRaw, attrs] = match;
    const tag = tagRaw.toLowerCase();
    out += decodeEntities(html.slice(cursor, match.index));
    cursor = tagRe.lastIndex;

    const isClosing = closingSlash === "/";
    if (["b", "strong", "i", "em"].includes(tag)) {
      const canonical = tag === "strong" ? "strong" : tag === "b" ? "b" : tag === "em" ? "em" : "i";
      out += isClosing ? `</${canonical}>` : `<${canonical}>`;
    } else if (tag === "a") {
      if (isClosing) {
        out += "</a>";
      } else {
        const hrefMatch = /href\s*=\s*"([^"]*)"|href\s*=\s*'([^']*)'/i.exec(attrs);
        const href = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? "") : "";
        out += href ? `<a href="${href.replace(/"/g, "&quot;")}">` : "<a>";
      }
    }
    // any other tag is dropped, its text content still flows through
  }
  out += decodeEntities(html.slice(cursor));
  return out.replace(/\s+/g, " ").trim();
}

type RawElement = { tag: string; innerHtml: string };

// Extracts top-level occurrences of `tagNames` in document order (heading/
// paragraph/list-item/etc. elements don't nest each other in well-formed
// markup, so unlike stripElements this doesn't need to handle same-tag
// nesting).
function extractElements(html: string, tagNames: Set<string>): RawElement[] {
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
  const results: RawElement[] = [];
  let openTag: string | null = null;
  let openStart = -1;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    const [, closingSlash, tagRaw] = match;
    const tag = tagRaw.toLowerCase();
    const isClosing = closingSlash === "/";

    if (openTag) {
      if (tag === openTag && isClosing) {
        results.push({ tag: openTag, innerHtml: html.slice(openStart, match.index) });
        openTag = null;
      }
      continue;
    }
    if (!isClosing && tagNames.has(tag)) {
      openTag = tag;
      openStart = tagRe.lastIndex;
    }
  }
  return results;
}

const CHROME_TAGS = new Set(["script", "style", "noscript", "nav", "header", "footer"]);
const CHROME_CLASS_RE = /\b(cookie|consent|gdpr|advert(?:is(?:ing|ement))?|banner|adslot|ad-slot)\b/i;
const CONTENT_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "blockquote", "figcaption"]);

// Best-effort HTML -> semantic-fragment extraction (docs/content-import.md
// Feature 2). Not a full HTML parser: a nesting-aware regex tag scanner,
// good enough for the review-before-insert workflow this feeds.
export function extractContentFragments(html: string): ContentFragment[] {
  const cleaned = stripElements(html, CHROME_TAGS, CHROME_CLASS_RE);
  const elements = extractElements(cleaned, CONTENT_TAGS);

  const fragments: ContentFragment[] = [];
  let currentSection: string | undefined;
  for (const el of elements) {
    const text = stripTags(el.innerHtml);
    if (!text) continue;

    const isHeading = /^h[1-6]$/.test(el.tag);
    const fragment: ContentFragment = {
      id: crypto.randomUUID(),
      semanticType: isHeading ? "heading" : el.tag === "p" ? "paragraph" : el.tag === "li" ? "listItem" : el.tag === "blockquote" ? "quote" : "caption",
      text,
      html: sanitizeInline(el.innerHtml) || undefined,
      sourceSection: currentSection,
    };
    if (isHeading) {
      fragment.headingLevel = Number(el.tag[1]) as ContentFragment["headingLevel"];
      currentSection = text;
    }
    fragments.push(fragment);
    if (fragments.length >= 300) break; // response-size sanity cap
  }
  return fragments;
}
