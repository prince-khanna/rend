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

  try {
    const keysToDelete = [...new Set([page.storage_key, page.rendered_key, page.source_key, ...(page.project_asset_keys ?? [])].filter(Boolean))] as string[];
    // Remove every object first. If cleanup is partial, retain the Page row so
    // an operator can retry rather than silently converting it into an orphan.
    await deleteFiles(keysToDelete);
    await deletePage(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[page-delete] cleanup_failed", {
      code: "page_cleanup_failed",
      pageId: id,
      errorType: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Page deletion could not complete; one or more owned objects require cleanup retry." },
      { status: 500 }
    );
  }
}
