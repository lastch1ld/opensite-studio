import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // packages/block-sdk and packages/plugin-api are workspace packages that
  // ship raw TypeScript (no build step — see docs/architecture.md's
  // packages/ split) — this tells Next to run its own TS/JSX transform
  // over them too, not just treat them as pre-built node_modules.
  transpilePackages: ["@opensite/block-sdk", "@opensite/plugin-api"],
};

export default nextConfig;
