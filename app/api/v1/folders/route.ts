import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-tokens";
import { getFolderById, insertFolder, listFoldersByUser } from "@/lib/folders";

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}

function validateName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (!name || name.length > 80 || /[\u0000-\u001f\u007f/\\]/.test(name)) return null;
  return name;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return apiError("unauthorized", auth.error, auth.status);
  try {
    return NextResponse.json({ folders: await listFoldersByUser(auth.userId, { serviceRole: true }) });
  } catch {
    return apiError("list_failed", "Folders could not be loaded", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return apiError("unauthorized", auth.error, auth.status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_body", "Request body must be valid JSON", 400);
  }

  const input = body as { name?: unknown; parent_id?: unknown };
  const name = validateName(input.name);
  if (!name) return apiError("invalid_name", "Folder name must be 1–80 characters and cannot contain path separators", 400);
  const parentId = input.parent_id == null || input.parent_id === "" ? null : input.parent_id;
  if (parentId !== null && !validId(parentId)) return apiError("invalid_parent", "Invalid parent folder", 400);
  if (parentId) {
    const parent = await getFolderById(parentId, { serviceRole: true });
    if (!parent || parent.user_id !== auth.userId) return apiError("not_found", "Parent folder not found", 404);
  }

  try {
    const folder = await insertFolder({
      id: randomUUID(),
      user_id: auth.userId,
      parent_id: parentId,
      name,
    }, { serviceRole: true });
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /duplicate|unique/i.test(error.message)) {
      return apiError("already_exists", "A folder with that name already exists here", 409);
    }
    return apiError("create_failed", "Folder could not be created", 500);
  }
}
