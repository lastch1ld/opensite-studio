import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { PageContent } from "@/components/blocks/types";

export function PublishedPage({ content }: { content: PageContent | null }) {
  if (!content) {
    return (
      <div style={{ padding: "48px", textAlign: "center", fontFamily: "sans-serif", color: "#666" }}>
        <h1>This site hasn&apos;t been published yet.</h1>
      </div>
    );
  }

  return <BlockRenderer block={content.root} />;
}
