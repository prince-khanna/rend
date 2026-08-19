import JSZip from "jszip";
import { SourceValidationError } from "./source";

export const MAX_PROJECT_ARCHIVE_SIZE = 20 * 1024 * 1024;
export const PROJECT_TOKEN_PLACEHOLDER = "__PIGEON_PROJECT_TOKEN__";
export const MAX_PROJECT_FILES = 100;
export const MAX_PROJECT_UNCOMPRESSED_SIZE = 50 * 1024 * 1024;

export type ProjectAsset = {
  path: string;
  bytes: Uint8Array;
};

function normalizeProjectPath(name: string): string {
  if (!name || name.length > 255 || /[\u0000-\u001f\u007f]/.test(name) || name.includes("\\") || name.startsWith("/") || /^[A-Za-z]:/.test(name)) {
    throw new SourceValidationError("HTML project paths must be normalized relative paths.", "invalid_project_path");
  }
  const parts = name.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new SourceValidationError("HTML project paths cannot contain traversal segments.", "invalid_project_path");
  }
  return parts.join("/");
}

export function projectAssetContentType(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf(".") + 1).toLowerCase();
  const types: Record<string, string> = {
    css: "text/css", js: "text/javascript", mjs: "text/javascript",
    json: "application/json", svg: "image/svg+xml", png: "image/png",
    jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
    avif: "image/avif", ico: "image/x-icon", woff: "font/woff", woff2: "font/woff2",
    ttf: "font/ttf", otf: "font/otf", txt: "text/plain",
  };
  return types[ext] ?? "application/octet-stream";
}

function validateZipDirectory(bytes: ArrayBuffer): void {
  const view = new DataView(bytes);
  const bytesArray = new Uint8Array(bytes);
  let end = -1;
  for (let offset = bytesArray.length - 22; offset >= Math.max(0, bytesArray.length - 65557); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) { end = offset; break; }
  }
  if (end < 0) throw new SourceValidationError("Invalid HTML project ZIP archive.", "invalid_project_archive");
  const count = view.getUint16(end + 10, true);
  const centralOffset = view.getUint32(end + 16, true);
  let offset = centralOffset;
  const seen = new Set<string>();
  for (let index = 0; index < count; index += 1) {
    if (offset + 46 > bytesArray.length || view.getUint32(offset, true) !== 0x02014b50) {
      throw new SourceValidationError("Invalid HTML project ZIP directory.", "invalid_project_archive");
    }
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const nameBytes = bytesArray.slice(offset + 46, offset + 46 + nameLength);
    const name = new TextDecoder().decode(nameBytes);
    const madeByUnix = (view.getUint8(offset + 5) === 3);
    const externalAttributes = view.getUint32(offset + 38, true);
    if (name.endsWith("/")) {
      offset += 46 + nameLength + extraLength + commentLength;
      continue;
    }
    const normalized = normalizeProjectPath(name);
    if (seen.has(normalized)) throw new SourceValidationError("HTML project contains duplicate paths.", "duplicate_project_path");
    seen.add(normalized);
    if (madeByUnix && ((externalAttributes >>> 16) & 0xf000) === 0xa000) {
      throw new SourceValidationError("HTML project symlinks are not allowed.", "project_symlink");
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
}

export async function extractHtmlProject(file: File): Promise<{ entryHtml: string; assets: ProjectAsset[] }> {
  if (file.size === 0) throw new SourceValidationError("Project archive cannot be empty.", "empty_source");
  if (file.size > MAX_PROJECT_ARCHIVE_SIZE) {
    throw new SourceValidationError(`HTML project archive exceeds ${MAX_PROJECT_ARCHIVE_SIZE} bytes.`, "file_too_large");
  }

  const archive = await file.arrayBuffer();
  validateZipDirectory(archive);
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(archive, { checkCRC32: true, createFolders: false });
  } catch {
    throw new SourceValidationError("Invalid HTML project ZIP archive.", "invalid_project_archive");
  }

  const files = Object.values(zip.files).filter((entry) => !entry.dir);
  if (files.length > MAX_PROJECT_FILES) {
    throw new SourceValidationError(`HTML project contains more than ${MAX_PROJECT_FILES} files.`, "project_limit");
  }

  const seen = new Set<string>();
  let totalBytes = 0;
  let entryHtml: string | null = null;
  const assets: ProjectAsset[] = [];
  for (const entry of files) {
    const unsafeName = (entry as JSZip.JSZipObject & { unsafeOriginalName?: string }).unsafeOriginalName ?? entry.name;
    const normalized = normalizeProjectPath(unsafeName);
    if (seen.has(normalized)) throw new SourceValidationError("HTML project contains duplicate paths.", "duplicate_project_path");
    seen.add(normalized);

    const permissions = typeof entry.unixPermissions === "number" ? entry.unixPermissions : 0;
    if ((permissions & 0o170000) === 0o120000) {
      throw new SourceValidationError("HTML project symlinks are not allowed.", "project_symlink");
    }

    const bytes = await entry.async("uint8array");
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_PROJECT_UNCOMPRESSED_SIZE) {
      throw new SourceValidationError(`HTML project expands beyond ${MAX_PROJECT_UNCOMPRESSED_SIZE} bytes.`, "project_limit");
    }
    if (normalized === "index.html") {
      try {
        entryHtml = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        throw new SourceValidationError("HTML project index.html must be valid UTF-8.", "invalid_encoding");
      }
    } else {
      assets.push({ path: normalized, bytes });
    }
  }

  if (!entryHtml) throw new SourceValidationError("HTML project must contain one root index.html.", "missing_project_entry");
  return { entryHtml, assets };
}

export function addProjectBase(html: string, projectUrl: string): string {
  const base = `<base href="${projectUrl.replaceAll('"', "&quot;")}">`;
  const head = /<head(?:\s[^>]*)?>/i.exec(html);
  if (head && head.index !== undefined) {
    const insertion = head.index + head[0].length;
    return `${html.slice(0, insertion)}${base}${html.slice(insertion)}`;
  }
  return `${base}${html}`;
}
