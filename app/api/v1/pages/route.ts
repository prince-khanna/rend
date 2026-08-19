import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-tokens";
import { getUploadMaxSize, uploadPage } from "@/lib/page-upload";
import { listPagesByUser } from "@/lib/pages";
import { SourceValidationError } from "@/lib/source";
import { MAX_PROJECT_ARCHIVE_SIZE } from "@/lib/html-project";

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function parseBoolean(value: FormDataEntryValue | null): boolean | undefined {
  if (value === null) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return undefined;
}

function getOrigin(request: NextRequest) {
  const protocol = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host") ?? "render.harnessagent.dev";
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) {
    return apiError("unauthorized", auth.error, auth.status);
  }

  try {
    const pages = await listPagesByUser(auth.userId, { serviceRole: true });
    const origin = getOrigin(request);

    return NextResponse.json({
      pages: pages.map((page) => ({
        id: page.id,
        name: page.name,
        is_public: page.is_public,
        source_type: page.source_type,
        source_family: page.source_family ?? page.source_type,
        source_format: page.source_format ?? (page.source_type === "markdown" ? "md" : "html"),
        original_filename: page.original_filename ?? `${page.name}.${page.source_type === "markdown" ? "md" : "html"}`,
        byte_size: page.byte_size,
        source_digest: page.source_digest,
        folder_id: page.folder_id,
        created_at: page.created_at,
        page_url: `${origin}/pages/${page.id}`,
        render_url: `${origin}/api/render/${page.id}`,
      })),
    });
  } catch (err) {
    console.error("[api/v1/pages] list error:", err);
    return apiError("list_failed", (err as Error).message, 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) {
    return apiError("unauthorized", auth.error, auth.status);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return apiError(
      "unsupported_content_type",
      "Use multipart/form-data with a file field.",
      415
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return apiError("file_required", "A file field is required.", 400);
  }

  const explicitPublic = parseBoolean(formData.get("is_public"));
  if (formData.has("is_public") && explicitPublic === undefined) {
    return apiError("invalid_visibility", "is_public must be true or false.", 400);
  }

  const name = formData.get("name");
  const folderIdValue = formData.get("folder_id");
  const folderId = folderIdValue ? String(folderIdValue).trim() : null;

  try {
    const { page } = await uploadPage({
      file,
      userId: auth.userId,
      name: typeof name === "string" ? name : null,
      isPublic: explicitPublic ?? false,
      folderId,
      serviceRoleInsert: true,
    });
    const origin = getOrigin(request);

    return NextResponse.json(
      {
        page: {
          id: page.id,
          name: page.name,
          is_public: page.is_public,
          source_type: page.source_type,
          source_family: page.source_family ?? page.source_type,
          source_format: page.source_format ?? (page.source_type === "markdown" ? "md" : "html"),
          original_filename: page.original_filename ?? `${page.name}.${page.source_type === "markdown" ? "md" : "html"}`,
          byte_size: page.byte_size,
          source_digest: page.source_digest,
          folder_id: page.folder_id,
          created_at: page.created_at,
          page_url: `${origin}/pages/${page.id}`,
          render_url: `${origin}/api/render/${page.id}`,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = (err as Error).message;
    if (err instanceof SourceValidationError) {
      if (err.code === "file_too_large") {
        const limit = file.name.toLowerCase().endsWith(".zip") ? MAX_PROJECT_ARCHIVE_SIZE : getUploadMaxSize();
        return apiError("file_too_large", `File exceeds ${limit} bytes.`, 413);
      }
      if (err.code === "unsupported_file_type" || err.code === "invalid_filename") {
        return apiError("unsupported_file_type", message, 400);
      }
      if (err.code === "invalid_folder") {
        return apiError("invalid_folder", message, 400);
      }
      return apiError("invalid_source", message, 400);
    }
    if (message.includes("byte limit") || message.includes("5MB")) {
      return apiError("file_too_large", `File exceeds ${getUploadMaxSize()} bytes.`, 413);
    }

    console.error("[api/v1/pages] upload_failed", {
      code: "upload_failed",
      errorType: err instanceof Error ? err.name : "unknown",
    });
    return apiError("upload_failed", "Page upload failed.", 500);
  }
}
