import { randomUUID } from "crypto";
import { renderMarkdownPage } from "./markdown";
import { addProjectBase, extractHtmlProject, projectAssetContentType, PROJECT_TOKEN_PLACEHOLDER } from "./html-project";
import { insertPage } from "./pages";
import { deleteFiles, uploadFile } from "./storage";
import {
  contentTypeForFormat,
  getDefaultPageName,
  getSourceDescriptor,
  MAX_SOURCE_SIZE,
  parseStructuredSource,
  readSourceText,
  renderDataPreview,
  renderTextPreview,
  sourceDigest,
  SourceValidationError,
  validateSourceFilename,
} from "./source";
import type { Page } from "./types";

export type UploadPageInput = {
  file: File;
  userId: string;
  name?: string | null;
  isPublic?: boolean;
  serviceRoleInsert?: boolean;
};

export type UploadPageResult = { page: Page };

export function getUploadMaxSize() {
  return MAX_SOURCE_SIZE;
}

/** Legacy name retained for callers that only need the family. */
export function getFileKind(fileName: string) {
  return getSourceDescriptor(fileName)?.family ?? null;
}

export { getDefaultPageName };

export async function uploadPage({
  file,
  userId,
  name,
  isPublic = true,
  serviceRoleInsert = false,
}: UploadPageInput): Promise<UploadPageResult> {
  validateSourceFilename(file.name);
  const descriptor = getSourceDescriptor(file.name);

  if (!descriptor) {
    throw new SourceValidationError(
      "Unsupported source format. Accepted formats are HTML, Markdown, JSON, YAML, scripts, and constrained HTML-project ZIPs.",
      "unsupported_file_type"
    );
  }
  if (file.size === 0) throw new SourceValidationError("Source cannot be empty.", "empty_source");
  if (descriptor.family !== "html_project" && file.size > MAX_SOURCE_SIZE) {
    throw new SourceValidationError(`File exceeds ${MAX_SOURCE_SIZE} byte limit.`, "file_too_large");
  }

  const id = randomUUID();
  const renderedKey = `${userId}/${id}/rendered.html`;
  const sourceKey = `${userId}/${id}/source.${descriptor.format}`;
  const pageName = (name?.trim() || getDefaultPageName(file.name)).slice(0, 120);
  const digest = await sourceDigest(file);
  let renderedHtml: Blob;
  let projectAssetEntries: { key: string; bytes: Uint8Array }[] = [];

  if (descriptor.family === "html_project") {
    const project = await extractHtmlProject(file);
    renderedHtml = new Blob([
      addProjectBase(project.entryHtml, `/api/render/${id}/project/${PROJECT_TOKEN_PLACEHOLDER}/`),
    ], { type: "text/html" });
    projectAssetEntries = project.assets.map((asset) => ({
      key: `${userId}/${id}/project/${asset.path}`,
      bytes: asset.bytes,
    }));
  } else if (descriptor.family === "html") {
    // Validate encoding even though the HTML bytes are retained exactly.
    await readSourceText(file);
    renderedHtml = file;
  } else {
    const source = await readSourceText(file);
    if (descriptor.family === "markdown") {
      renderedHtml = new Blob([await renderMarkdownPage(source)], { type: "text/html" });
    } else if (descriptor.family === "data") {
      const value = parseStructuredSource(source, descriptor.format as "json" | "yaml" | "yml");
      renderedHtml = new Blob([
        renderDataPreview(value, file.name, descriptor.format),
      ], { type: "text/html" });
    } else {
      renderedHtml = new Blob([
        renderTextPreview(source, file.name, descriptor.format),
      ], { type: "text/html" });
    }
  }

  const uploadedKeys: string[] = [];
  try {
    await uploadFile(renderedKey, renderedHtml, "text/html");
    uploadedKeys.push(renderedKey);
    await uploadFile(sourceKey, file, contentTypeForFormat(descriptor.format));
    uploadedKeys.push(sourceKey);
    for (const asset of projectAssetEntries) {
      await uploadFile(asset.key, new Blob([asset.bytes as unknown as BlobPart]), projectAssetContentType(asset.key));
      uploadedKeys.push(asset.key);
    }

    const page = await insertPage(
      {
        id,
        user_id: userId,
        name: pageName,
        storage_key: renderedKey,
        is_public: isPublic,
        source_type: descriptor.family,
        source_key: sourceKey,
        source_family: descriptor.family,
        source_format: descriptor.format,
        original_filename: file.name,
        byte_size: file.size,
        source_digest: digest,
        rendered_key: renderedKey,
        project_asset_keys: projectAssetEntries.map((asset) => asset.key),
      },
      { serviceRole: serviceRoleInsert }
    );

    return { page };
  } catch (error) {
    // Storage and database writes are not transactional. Compensate for every
    // object created by this attempt without masking the original failure.
    try {
      await deleteFiles(uploadedKeys);
    } catch (cleanupError) {
      console.error("[page-upload] cleanup_failed", {
        code: "upload_cleanup_failed",
        pageId: id,
        sourceFamily: descriptor.family,
        sourceFormat: descriptor.format,
        keyCount: uploadedKeys.length,
        error: cleanupError instanceof Error ? cleanupError.message : "unknown",
      });
    }
    throw error;
  }
}
