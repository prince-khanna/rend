import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { getPageById } from "@/lib/pages";
import { PAGE_RENDER_HEADERS } from "@/lib/render-security";
import { createProjectAccessToken } from "@/lib/project-access";
import { PROJECT_TOKEN_PLACEHOLDER } from "@/lib/html-project";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const page = await getPageById(id);
  if (!page) return new NextResponse("Not found", { status: 404 });

  if (!page.is_public) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== page.user_id) {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from("pages")
    .download(page.storage_key);

  if (error || !data) {
    console.error("[render] load_failed", { code: "render_load_failed", pageId: id });
    return new NextResponse("Failed to load Page preview", { status: 500 });
  }

  let html = await data.text();
  if (page.source_family === "html_project" || page.source_type === "html_project") {
    const token = createProjectAccessToken(page.id);
    html = html.replace(
      `/api/render/${id}/project/${PROJECT_TOKEN_PLACEHOLDER}/`,
      `/api/render/${id}/project/${token}/`,
    );
  }

  return new NextResponse(html, {
    headers: {
      ...PAGE_RENDER_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
