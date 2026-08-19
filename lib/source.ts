import { createHash } from "crypto";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { SourceFamily, SourceFormat } from "./types";

export const MAX_SOURCE_SIZE = 5 * 1024 * 1024;
const MAX_STRUCTURED_DEPTH = 100;
const MAX_STRUCTURED_NODES = 100_000;

export const SOURCE_EXTENSIONS = {
  html: ["html", "htm"],
  markdown: ["md", "markdown"],
  data: ["json", "yaml", "yml"],
  script: ["js", "mjs", "cjs", "ts", "tsx", "jsx", "py", "sh", "bash", "zsh", "ps1", "rb", "php"],
  html_project: ["zip"],
} as const satisfies Record<SourceFamily, readonly SourceFormat[]>;

export class SourceValidationError extends Error {
  constructor(message: string, public readonly code: string = "invalid_source") {
    super(message);
    this.name = "SourceValidationError";
  }
}

function extension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot >= 0 ? fileName.slice(lastDot + 1).toLowerCase() : "";
}

export function getSourceDescriptor(fileName: string): {
  family: SourceFamily;
  format: SourceFormat;
} | null {
  const ext = extension(fileName);
  for (const [family, formats] of Object.entries(SOURCE_EXTENSIONS) as [SourceFamily, readonly string[]][]) {
    if (formats.includes(ext)) return { family, format: ext as SourceFormat };
  }
  return null;
}

export function getDefaultPageName(fileName: string): string {
  const cleanName = fileName.split(/[\\/]/).pop() ?? fileName;
  return cleanName.replace(/\.[^.]+$/, "");
}

export function validateSourceFilename(fileName: string): void {
  if (!fileName || fileName.length > 255 || /[\u0000-\u001f\u007f]/.test(fileName) || /[\\/]/.test(fileName)) {
    throw new SourceValidationError("Filename must be a simple name without path separators.", "invalid_filename");
  }
}

export async function readSourceText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0) throw new SourceValidationError("Source cannot be empty.", "empty_source");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new SourceValidationError("Source must be valid UTF-8 text.", "invalid_encoding");
  }
}

export async function sourceDigest(file: File): Promise<string> {
  return createHash("sha256").update(new Uint8Array(await file.arrayBuffer())).digest("hex");
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function previewDocument(title: string, context: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>body{margin:0;padding:1rem;background:#fff;color:#24292f;font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}header{margin-bottom:1rem;font-family:system-ui,sans-serif}h1{font-size:1rem;margin:0 0 .25rem}p{color:#57606a;margin:0}pre{white-space:pre-wrap;overflow:auto;border:1px solid #d0d7de;border-radius:6px;padding:1rem;background:#f6f8fa}code{font:inherit}</style></head><body><header><h1>${escapeHtml(title)}</h1><p>${escapeHtml(context)}</p></header>${body}</body></html>`;
}

export function renderTextPreview(source: string, fileName: string, format: SourceFormat): string {
  return previewDocument(fileName, `${format.toUpperCase()} source · non-executable preview`, `<pre><code>${escapeHtml(source)}</code></pre>`);
}

export function renderDataPreview(value: unknown, fileName: string, format: SourceFormat): string {
  let normalized: string;
  try {
    normalized = JSON.stringify(value, null, 2) ?? "null";
  } catch {
    // YAML aliases can describe a cycle. YAML's safe stringifier preserves the
    // value as data without attempting to evaluate it or crashing the upload.
    normalized = stringifyYaml(value);
  }
  return previewDocument(fileName, `${format.toUpperCase()} data · parsed safely · non-executable preview`, `<pre><code>${escapeHtml(normalized)}</code></pre>`);
}

function validateStructuredShape(value: unknown): void {
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  const seen = new WeakSet<object>();
  let nodes = 0;

  while (stack.length > 0) {
    const current = stack.pop()!;
    nodes += 1;
    if (nodes > MAX_STRUCTURED_NODES) throw new Error("structured source contains too many values");
    if (current.depth > MAX_STRUCTURED_DEPTH) throw new Error("structured source is nested too deeply");
    if (!current.value || typeof current.value !== "object") continue;
    if (seen.has(current.value)) continue;
    seen.add(current.value);
    for (const child of Object.values(current.value)) {
      stack.push({ value: child, depth: current.depth + 1 });
    }
  }
}

export function parseStructuredSource(source: string, format: "json" | "yaml" | "yml"): unknown {
  try {
    const value = format === "json"
      ? JSON.parse(source)
      : parseYaml(source, { maxAliasCount: 20, prettyErrors: true });
    validateStructuredShape(value);
    return value;
  } catch (error) {
    const detail = error instanceof Error ? error.message.split("\n")[0] : "invalid syntax";
    throw new SourceValidationError(`Invalid ${format.toUpperCase()} source: ${detail}`, "invalid_structured_source");
  }
}

export function contentTypeForFormat(format: SourceFormat): string {
  if (format === "html" || format === "htm") return "text/html";
  if (format === "md" || format === "markdown") return "text/markdown";
  if (format === "json") return "application/json";
  if (format === "yaml" || format === "yml") return "application/yaml";
  if (format === "zip") return "application/zip";
  return "text/plain";
}
