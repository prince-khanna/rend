import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-tokens";
import { getPageById } from "@/lib/pages";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { contentTypeForFormat } from "@/lib/source";
import type { SourceFormat } from "@/lib/types";
import { createProjectAccessToken } from "@/lib/project-access";
import { PROJECT_TOKEN_PLACEHOLDER } from "@/lib/html-project";

type Params = { params: Promise<{ id: string }> };

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function getDownloadName(page: { name: string; original_filename: string | null; source_format: SourceFormat | null }, rendered: boolean) {
  const original = rendered ? "" : page.original_filename?.split(/[\\/]/).pop() ?? "";
  const extension = rendered ? "html" : (page.source_format ?? "html");
  const safeName = (original || `${page.name}.${extension}`)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[^\w .()-]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 180)
    .trim();

  return safeName || `page.${extension}`;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) {
    return apiError("unauthorized", auth.error, auth.status);
  }

  const { id } = await params;
  const page = await getPageById(id, { serviceRole: true });

  if (!page || page.user_id !== auth.userId) {
    return apiError("not_found", "Page not found.", 404);
  }

  const variant = request.nextUrl.searchParams.get("variant");
  const downloadRendered = variant === "rendered";
  const storageKey = downloadRendered ? page.storage_key : page.source_key ?? page.storage_key;
  const extension = downloadRendered ? "html" : (page.source_format ?? (page.source_type === "markdown" ? "md" : "html"));
  const contentType = downloadRendered
    ? "text/html"
    : contentTypeForFormat(extension as SourceFormat);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from("pages").download(storageKey);

  if (error || !data) {
    return apiError("download_failed", "Failed to load Page source.", 500);
  }

  let responseBody: BodyInit = data;
  if (downloadRendered && (page.source_family === "html_project" || page.source_type === "html_project")) {
    responseBody = (await data.text()).replace(
      `/api/render/${page.id}/project/${PROJECT_TOKEN_PLACEHOLDER}/`,
      `/api/render/${page.id}/project/${createProjectAccessToken(page.id)}/`,
    );
  }

  return new NextResponse(responseBody, {
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${getDownloadName(page, downloadRendered)}"`,
      ...(page.source_digest ? { "X-Page-Source-Digest": page.source_digest } : {}),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
