#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const DEFAULT_API_URL = "https://render.harnessagent.dev";
const CONFIG_DIR = path.join(os.homedir(), ".pigeon");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function printHelp() {
  console.log(`Usage:
  pigeon auth login [--token <token>] [--api-url <url>]
  pigeon auth logout
  pigeon auth help
  pigeon upload <file> [--name <name>] [--public|--private] [--api-url <url>]
  pigeon u <file> [--name <name>] [--public|--private] [--api-url <url>]
  pigeon upload help
  pigeon delete <page-id> [--api-url <url>]
  pigeon delete help
  pigeon download <page-id> [--output <path>] [--rendered] [--api-url <url>]
  pigeon download help
  pigeon list [--api-url <url>]
  pigeon list help

Environment:
  PIGEON_API_URL      Override the Pigeon base URL.
  PIGEON_API_TOKEN    Use an API token without saving it.

Run \`pigeon <command> help\` for command-specific examples.`);
}

function printAuthHelp() {
  console.log(`Usage:
  pigeon auth login [--token <token>] [--api-url <url>]
  pigeon auth logout

Examples:
  pigeon auth login
  pigeon auth login --token rnd_live_your_token_here
  pigeon auth login --token rnd_live_your_token_here --api-url http://localhost:3000
  pigeon auth logout

Notes:
  Create API tokens from Settings -> API tokens in Pigeon.
  Login stores the token in ~/.pigeon/config.json.`);
}

function printUploadHelp() {
  console.log(`Usage:
  pigeon upload <file> [--name <name>] [--public|--private] [--api-url <url>]
  pigeon u <file> [--name <name>] [--public|--private] [--api-url <url>]

Examples:
  pigeon upload ./page.md
  pigeon upload ./page.html --name "Launch Notes" --public
  pigeon u ./draft.md --private
  PIGEON_API_TOKEN=rnd_live_your_token_here pigeon u ./page.md --api-url http://localhost:3000

Notes:
  API uploads are private by default.
  Supported Page sources are .html and .md.`);
}

function printDeleteHelp() {
  console.log(`Usage:
  pigeon delete <page-id> [--api-url <url>]

Examples:
  pigeon delete 2ad2e2c2-8c95-4a86-9b4e-df697da9ce4f
  PIGEON_API_TOKEN=rnd_live_your_token_here pigeon delete 2ad2e2c2-8c95-4a86-9b4e-df697da9ce4f

Notes:
  Delete only works for Pages owned by the API token user.
  Deleted Pages are hard-deleted.`);
}

function printDownloadHelp() {
  console.log(`Usage:
  pigeon download <page-id> [--output <path>] [--rendered] [--api-url <url>]

Examples:
  pigeon download 2ad2e2c2-8c95-4a86-9b4e-df697da9ce4f
  pigeon download 2ad2e2c2-8c95-4a86-9b4e-df697da9ce4f --output ./page.md
  pigeon download 2ad2e2c2-8c95-4a86-9b4e-df697da9ce4f --rendered --output ./page.html

Notes:
  By default this downloads the original Page source.
  Use --rendered to download rendered HTML for Markdown Pages.`);
}

function printListHelp() {
  console.log(`Usage:
  pigeon list [--api-url <url>]

Examples:
  pigeon list
  pigeon list --api-url http://localhost:3000
  PIGEON_API_TOKEN=rnd_live_your_token_here pigeon list

Notes:
  Lists all Pages owned by the API token user.`);
}

function printCommandHelp(command) {
  if (command === "auth") {
    printAuthHelp();
  } else if (command === "upload" || command === "u") {
    printUploadHelp();
  } else if (command === "delete") {
    printDeleteHelp();
  } else if (command === "download") {
    printDownloadHelp();
  } else if (command === "list") {
    printListHelp();
  } else {
    printHelp();
  }
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeConfig(config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o600,
  });
}

function removeConfigToken() {
  const config = readConfig();
  delete config.token;
  writeConfig(config);
}

function parseArgs(argv) {
  const args = [];
  const flags = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args.push(arg);
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    if (inlineValue !== undefined) {
      flags[key] = inlineValue;
    } else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
      flags[key] = argv[i + 1];
      i += 1;
    } else {
      flags[key] = true;
    }
  }

  return { args, flags };
}

function getApiUrl(flags = {}) {
  const config = readConfig();
  return String(flags.apiUrl || process.env.PIGEON_API_URL || config.apiUrl || DEFAULT_API_URL)
    .replace(/\/+$/, "");
}

function getToken() {
  return process.env.PIGEON_API_TOKEN || readConfig().token;
}

function requireToken() {
  const token = getToken();
  if (!token) {
    throw new Error("Run `pigeon auth login` first or set PIGEON_API_TOKEN.");
  }
  return token;
}

async function readTokenFromPrompt() {
  const rl = readline.createInterface({ input, output });
  try {
    const token = await rl.question("API token: ");
    return token.trim();
  } finally {
    rl.close();
  }
}

function asApiError(response, body) {
  const parsed = tryJson(body);
  const message = parsed?.error?.message || body || response.statusText;
  return new Error(`${response.status} ${message}`);
}

function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request(apiUrl, pathname, options = {}) {
  const response = await fetch(`${apiUrl}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw asApiError(response, await response.text());
  }

  return response;
}

async function login(flags) {
  const token = String(flags.token || (await readTokenFromPrompt())).trim();
  if (!token) throw new Error("API token is required.");

  const apiUrl = getApiUrl(flags);
  writeConfig({ ...readConfig(), apiUrl, token });
  console.log(`Logged in to ${apiUrl}.`);
}

function logout() {
  removeConfigToken();
  console.log("Logged out.");
}

async function upload(filePath, flags) {
  if (!filePath) throw new Error("Usage: pigeon upload <file>");

  const resolvedPath = path.resolve(filePath);
  const file = await fs.openAsBlob(resolvedPath);
  const form = new FormData();
  form.set("file", file, path.basename(resolvedPath));

  if (flags.name) form.set("name", String(flags.name));
  if (flags.public && flags.private) {
    throw new Error("Use either --public or --private, not both.");
  }
  if (flags.public) form.set("is_public", "true");
  if (flags.private) form.set("is_public", "false");

  const response = await request(getApiUrl(flags), "/api/v1/pages", {
    method: "POST",
    body: form,
  });
  const result = await response.json();

  console.log(`Uploaded Page: ${result.page.name}`);
  console.log(`ID: ${result.page.id}`);
  console.log(`URL: ${result.page.page_url}`);
  console.log(`Public: ${result.page.is_public}`);
}

async function deletePage(pageId, flags) {
  if (!pageId) throw new Error("Usage: pigeon delete <page-id>");

  const response = await request(getApiUrl(flags), `/api/v1/pages/${pageId}`, {
    method: "DELETE",
  });
  const result = await response.json();
  console.log(`Deleted Page: ${result.deleted.name} (${result.deleted.id})`);
}

function getFilenameFromDisposition(disposition) {
  const match = /filename="([^"]+)"/i.exec(disposition || "");
  return match ? match[1] : null;
}

async function download(pageId, flags) {
  if (!pageId) throw new Error("Usage: pigeon download <page-id>");

  const query = flags.rendered ? "?variant=rendered" : "";
  const response = await request(
    getApiUrl(flags),
    `/api/v1/pages/${pageId}/download${query}`
  );
  const disposition = response.headers.get("content-disposition");
  const outputPath = path.resolve(
    String(flags.output || getFilenameFromDisposition(disposition) || `${pageId}.html`)
  );
  const buffer = Buffer.from(await response.arrayBuffer());

  fs.writeFileSync(outputPath, buffer);
  console.log(`Downloaded Page to ${outputPath}`);
}

async function list(flags) {
  const response = await request(getApiUrl(flags), "/api/v1/pages");
  const result = await response.json();

  if (!result.pages || result.pages.length === 0) {
    console.log("No Pages found.");
    return;
  }

  console.log(`Found ${result.pages.length} Page(s):\n`);
  result.pages.forEach((page) => {
    console.log(`  ${page.name}`);
    console.log(`    ID: ${page.id}`);
    console.log(`    Public: ${page.is_public}`);
    console.log(`    Created: ${new Date(page.created_at).toLocaleString()}`);
    console.log();
  });
}

async function main() {
  const [command, subcommand, ...rest] = process.argv.slice(2);

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }
  if (subcommand === "help" || subcommand === "--help" || subcommand === "-h") {
    printCommandHelp(command);
    return;
  }

  if (command === "auth" && subcommand === "login") {
    const { flags } = parseArgs(rest);
    await login(flags);
  } else if (command === "auth" && subcommand === "logout") {
    logout();
  } else if (command === "upload" || command === "u") {
    const parsed = parseArgs([subcommand, ...rest].filter(Boolean));
    await upload(parsed.args[0], parsed.flags);
  } else if (command === "delete") {
    const { flags } = parseArgs(rest);
    await deletePage(subcommand, flags);
  } else if (command === "download") {
    const { flags } = parseArgs(rest);
    await download(subcommand, flags);
  } else if (command === "list") {
    const { flags } = parseArgs([subcommand, ...rest].filter(Boolean));
    await list(flags);
  } else {
    printHelp();
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`pigeon: ${error.message}`);
  process.exitCode = 1;
});
