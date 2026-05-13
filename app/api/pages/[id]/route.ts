import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { togglePageVisibility, deletePage, getPageById } from "@/lib/pages";
import { deleteFiles } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { is_public } = await request.json();
  await togglePageVisibility(id, user.id, is_public);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await getPageById(id);
  if (!page || page.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deletePage(id, user.id);
  const keysToDelete = [page.storage_key, page.source_key].filter(Boolean) as string[];
  await deleteFiles(keysToDelete);

  return NextResponse.json({ ok: true });
}
