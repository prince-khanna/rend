import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase-server";
import { getPageById } from "@/lib/pages";
import { contentTypeForFormat } from "@/lib/source";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

function safeFilename(page: {
  original_filename: string | null;
  name: string;
  source_format: string | null;
}): string {
  const fallbackExtension = page.source_format ?? "html";
  const original = page.original_filename?.split(/[\\/]/).pop() ?? "";
  const candidate = (original || `${page.name}.${fallbackExtension}`)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[^\w .()-]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return candidate || `page.${fallbackExtension}`;
}

export async function GET(_request: NextRequest, { params }: Params) {
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

  const key = page.source_key ?? page.storage_key;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from("pages").download(key);
  if (error || !data) {
    console.error("[page-download] source_load_failed", { code: "source_load_failed", pageId: page.id });
    return new NextResponse("Failed to load Page source", { status: 500 });
  }

  const format = page.source_format ?? (page.source_type === "markdown" ? "md" : "html");
  return new NextResponse(data, {
    headers: {
      "Content-Type": `${contentTypeForFormat(format)}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${safeFilename(page)}"`,
      "X-Content-Type-Options": "nosniff",
      ...(page.source_digest ? { "X-Page-Source-Digest": page.source_digest } : {}),
    },
  });
}
