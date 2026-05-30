import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-tokens";
import { getPageById } from "@/lib/pages";
import { createServiceRoleClient } from "@/lib/supabase-server";

type Params = { params: Promise<{ id: string }> };

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function getDownloadName(pageName: string, extension: "html" | "md") {
  const safeName = pageName
    .trim()
    .replace(/[^\w .-]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120)
    .trim();

  return `${safeName || "page"}.${extension}`;
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
  const extension = downloadRendered || !page.source_key ? "html" : "md";
  const contentType = extension === "md" ? "text/markdown" : "text/html";

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from("pages").download(storageKey);

  if (error || !data) {
    return apiError("download_failed", "Failed to load Page source.", 500);
  }

  return new NextResponse(data, {
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${getDownloadName(
        page.name,
        extension
      )}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
