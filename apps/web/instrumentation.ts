// Next.js's supported app-startup hook (runs once per server process,
// before request handling begins) — the natural place for
// docs/plugin-sdk.md's "scan /plugins at app startup" step. See
// lib/plugins/loadPlugins.ts for what actually happens.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { loadPlugins } = await import("@/lib/plugins/loadPlugins");
    await loadPlugins();
  }
}
