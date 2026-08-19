import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getFolderById, insertFolder, listFoldersByUser } from "@/lib/folders";

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}

function validateName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (!name || name.length > 80 || /[\u0000-\u001f\u007f/\\]/.test(name)) return null;
  return name;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folders = await listFoldersByUser(user.id);
  return NextResponse.json({ folders });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = body as { name?: unknown; parent_id?: unknown };
  const name = validateName(input.name);
  if (!name) {
    return NextResponse.json({ error: "Folder name must be 1–80 characters and cannot contain path separators" }, { status: 400 });
  }

  const parentId = input.parent_id == null || input.parent_id === "" ? null : input.parent_id;
  if (parentId !== null && !validId(parentId)) {
    return NextResponse.json({ error: "Invalid parent folder" }, { status: 400 });
  }
  if (parentId) {
    const parent = await getFolderById(parentId);
    if (!parent || parent.user_id !== user.id) {
      return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
    }
  }

  try {
    const folder = await insertFolder({
      id: randomUUID(),
      user_id: user.id,
      parent_id: parentId,
      name,
    });
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /duplicate|unique/i.test(error.message)) {
      return NextResponse.json({ error: "A folder with that name already exists here" }, { status: 409 });
    }
    console.error("[folders] create_failed", { code: "folder_create_failed" });
    return NextResponse.json({ error: "Folder could not be created" }, { status: 500 });
  }
}
