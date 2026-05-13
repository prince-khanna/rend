import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { getPageById } from "@/lib/pages";

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
    return new NextResponse("Failed to load file", { status: 500 });
  }

  const html = await data.text();

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
