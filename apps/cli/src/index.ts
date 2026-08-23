#!/usr/bin/env node
import { Command } from "commander";
import { ApiError, getPage, listPages, listSites, publishPage, resolveOptions } from "./client.js";

const program = new Command();

program
  .name("opensite")
  .description("CLI for OpenSite Studio's public API (docs/api.md)")
  .version("0.1.0")
  .option("--api-url <url>", "API base URL (or set OPENSITE_API_URL)");

function fail(err: unknown): never {
  if (err instanceof ApiError) {
    console.error(`Error (${err.status}): ${err.message}`);
  } else if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error("Unknown error", err);
  }
  process.exit(1);
}

function print(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

const sites = program.command("sites").description("Manage sites");

sites
  .command("list")
  .description("List sites accessible to the current API key")
  .action(async () => {
    try {
      const client = resolveOptions(program.opts());
      print(await listSites(client));
    } catch (err) {
      fail(err);
    }
  });

const pages = program.command("pages").description("Manage pages");

pages
  .command("list")
  .description("List pages for a site")
  .requiredOption("--site <siteId>", "Site id")
  .action(async (opts: { site: string }) => {
    try {
      const client = resolveOptions(program.opts());
      print(await listPages(client, opts.site));
    } catch (err) {
      fail(err);
    }
  });

pages
  .command("get <pageId>")
  .description("Dump a page's draft/published content JSON")
  .requiredOption("--site <siteId>", "Site id")
  .action(async (pageId: string, opts: { site: string }) => {
    try {
      const client = resolveOptions(program.opts());
      print(await getPage(client, opts.site, pageId));
    } catch (err) {
      fail(err);
    }
  });

pages
  .command("publish <pageId>")
  .description("Publish a page (copies draftContent to publishedContent)")
  .requiredOption("--site <siteId>", "Site id")
  .action(async (pageId: string, opts: { site: string }) => {
    try {
      const client = resolveOptions(program.opts());
      print(await publishPage(client, opts.site, pageId));
    } catch (err) {
      fail(err);
    }
  });

program.parseAsync(process.argv);
