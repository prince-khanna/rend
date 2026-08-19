import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase-server";
import { getPageById } from "@/lib/pages";
import { PAGE_RENDER_HEADERS } from "@/lib/render-security";
import { projectAssetContentType } from "@/lib/html-project";

type Params = { params: Promise<{ id: string; path: string[] }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id, path } = await params;
  if (!path.length || path.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const page = await getPageById(id);
  if (!page) return new NextResponse("Not found", { status: 404 });
  if (!page.is_public) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== page.user_id) return new NextResponse("Not found", { status: 404 });
  }

  const key = `${page.user_id}/${page.id}/project/${path.join("/")}`;
  if (!page.project_asset_keys?.includes(key)) return new NextResponse("Not found", { status: 404 });
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from("pages").download(key);
  if (error || !data) return new NextResponse("Failed to load project asset", { status: 500 });

  return new NextResponse(data, {
    headers: {
      ...PAGE_RENDER_HEADERS,
      "Content-Type": projectAssetContentType(path[path.length - 1]),
      "Cache-Control": "private, max-age=60",
    },
  });
}
