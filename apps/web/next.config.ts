import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // packages/block-sdk and packages/plugin-api are workspace packages that
  // ship raw TypeScript (no build step — see docs/architecture.md's
  // packages/ split) — this tells Next to run its own TS/JSX transform
  // over them too, not just treat them as pre-built node_modules.
  transpilePackages: ["@opensite/block-sdk", "@opensite/plugin-api"],
  // The repo already has its own root AGENTS.md documenting this project's
  // conventions (see AGENTS.md) — disable Next's auto-generated apps/web/
  // AGENTS.md and CLAUDE.md so there isn't a second, generic one nearby.
  agentRules: false,
};

export default nextConfig;
