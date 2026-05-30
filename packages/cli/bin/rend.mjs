#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const DEFAULT_API_URL = "https://render.harnessagent.dev";
const CONFIG_DIR = path.join(os.homedir(), ".rend");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function printHelp() {
  console.log(`Usage:
  rend auth login [--token <token>] [--api-url <url>]
  rend auth logout
  rend auth help
  rend upload <file> [--name <name>] [--public|--private] [--api-url <url>]
  rend u <file> [--name <name>] [--public|--private] [--api-url <url>]
  rend upload help
  rend delete <page-id> [--api-url <url>]
  rend delete help
  rend download <page-id> [--output <path>] [--rendered] [--api-url <url>]
  rend download help

Environment:
  REND_API_URL      Override the Rend base URL.
  REND_API_TOKEN    Use an API token without saving it.

Run \`rend <command> help\` for command-specific examples.`);
}

function printAuthHelp() {
  console.log(`Usage:
  rend auth login [--token <token>] [--api-url <url>]
  rend auth logout

Examples:
  rend auth login
  rend auth login --token rnd_live_your_token_here
  rend auth login --token rnd_live_your_token_here --api-url http://localhost:3000
  rend auth logout

Notes:
  Create API tokens from Settings -> API tokens in Rend.
  Login stores the token in ~/.rend/config.json.`);
}

function printUploadHelp() {
  console.log(`Usage:
  rend upload <file> [--name <name>] [--public|--private] [--api-url <url>]
  rend u <file> [--name <name>] [--public|--private] [--api-url <url>]

Examples:
  rend upload ./page.md
  rend upload ./page.html --name "Launch Notes" --public
  rend u ./draft.md --private
  REND_API_TOKEN=rnd_live_your_token_here rend u ./page.md --api-url http://localhost:3000

Notes:
  API uploads are private by default.
  Supported Page sources are .html and .md.`);
}

function printDeleteHelp() {
  console.log(`Usage:
  rend delete <page-id> [--api-url <url>]

Examples:
  rend delete 2ad2e2c2-8c95-4a86-9b4e-df697da9ce4f
  REND_API_TOKEN=rnd_live_your_token_here rend delete 2ad2e2c2-8c95-4a86-9b4e-df697da9ce4f

Notes:
  Delete only works for Pages owned by the API token user.
  Deleted Pages are hard-deleted.`);
}

function printDownloadHelp() {
  console.log(`Usage:
  rend download <page-id> [--output <path>] [--rendered] [--api-url <url>]

Examples:
  rend download 2ad2e2c2-8c95-4a86-9b4e-df697da9ce4f
  rend download 2ad2e2c2-8c95-4a86-9b4e-df697da9ce4f --output ./page.md
  rend download 2ad2e2c2-8c95-4a86-9b4e-df697da9ce4f --rendered --output ./page.html

Notes:
  By default this downloads the original Page source.
  Use --rendered to download rendered HTML for Markdown Pages.`);
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
  return String(flags.apiUrl || process.env.REND_API_URL || config.apiUrl || DEFAULT_API_URL)
    .replace(/\/+$/, "");
}

function getToken() {
  return process.env.REND_API_TOKEN || readConfig().token;
}

function requireToken() {
  const token = getToken();
  if (!token) {
    throw new Error("Run `rend auth login` first or set REND_API_TOKEN.");
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
  if (!filePath) throw new Error("Usage: rend upload <file>");

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
  if (!pageId) throw new Error("Usage: rend delete <page-id>");

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
  if (!pageId) throw new Error("Usage: rend download <page-id>");

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
  } else {
    printHelp();
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`rend: ${error.message}`);
  process.exitCode = 1;
});
