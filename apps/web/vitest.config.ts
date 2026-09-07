import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

// Node environment only: every test here covers pure lib logic or the
// server-only site-template builders. Nothing renders React — the block
// registry is read as source text (see tests/support/registry.ts) rather
// than imported, so these tests never pull the client bundle into Node.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
