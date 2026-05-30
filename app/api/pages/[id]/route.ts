import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { togglePageVisibility, deletePage, getPageById, renamePage } from "@/lib/pages";
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

  const body = await request.json();

  if ("name" in body) {
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (name.length > 120) {
      return NextResponse.json({ error: "Name must be 120 characters or fewer" }, { status: 400 });
    }
    await renamePage(id, user.id, name);
    return NextResponse.json({ ok: true });
  }

  if ("is_public" in body) {
    await togglePageVisibility(id, user.id, Boolean(body.is_public));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "No supported fields provided" }, { status: 400 });
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
