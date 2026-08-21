import type { PageContent } from "@/components/blocks/types";
import { randomUUID } from "crypto";

export function emptyPageContent(): PageContent {
  return {
    version: 1,
    root: {
      id: randomUUID(),
      type: "section",
      props: { layout: "stack" },
      style: { base: { padding: "24px", background: "#ffffff" } },
      children: [],
    },
  };
}
