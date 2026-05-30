import { randomUUID } from "crypto";
import { marked } from "marked";
import { insertPage } from "./pages";
import { uploadFile } from "./storage";
import type { Page } from "./types";

const MAX_SIZE = 5 * 1024 * 1024;

export type UploadPageInput = {
  file: File;
  userId: string;
  name?: string | null;
  isPublic?: boolean;
  serviceRoleInsert?: boolean;
};

export type UploadPageResult = {
  page: Page;
};

export function getUploadMaxSize() {
  return MAX_SIZE;
}

function wrapMarkdownHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown-light.min.css" />
  <style>
    body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 45px; }
    @media (max-width: 767px) { body { padding: 15px; } }
  </style>
</head>
<body class="markdown-body">
${bodyHtml}
</body>
</html>`;
}

export function getFileKind(fileName: string): "html" | "markdown" | null {
  if (/\.html$/i.test(fileName)) return "html";
  if (/\.md$/i.test(fileName)) return "markdown";
  return null;
}

export function getDefaultPageName(fileName: string) {
  return fileName.replace(/\.(html|md)$/i, "");
}

export async function uploadPage({
  file,
  userId,
  name,
  isPublic = true,
  serviceRoleInsert = false,
}: UploadPageInput): Promise<UploadPageResult> {
  const sourceType = getFileKind(file.name);

  if (!sourceType) {
    throw new Error("Only .html and .md files are accepted");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("File exceeds 5MB limit");
  }

  const id = randomUUID();
  const storageKey = `${userId}/${id}.html`;
  const pageName = (name?.trim() || getDefaultPageName(file.name)).slice(0, 120);

  let fileToStore: Blob;
  let sourceKey: string | null = null;

  if (sourceType === "markdown") {
    const rawText = await file.text();
    const bodyHtml = await marked(rawText);
    const fullHtml = wrapMarkdownHtml(bodyHtml);
    fileToStore = new Blob([fullHtml], { type: "text/html" });
    sourceKey = `${userId}/${id}.md`;
  } else {
    fileToStore = file;
  }

  await uploadFile(storageKey, fileToStore, "text/html");
  if (sourceKey) {
    await uploadFile(sourceKey, file, "text/markdown");
  }

  const page = await insertPage(
    {
      id,
      user_id: userId,
      name: pageName,
      storage_key: storageKey,
      is_public: isPublic,
      source_type: sourceType,
      source_key: sourceKey,
    },
    { serviceRole: serviceRoleInsert }
  );

  return { page };
}
