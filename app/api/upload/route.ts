import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { uploadPage } from "@/lib/page-upload";
import { SourceValidationError } from "@/lib/source";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const rawFolderId = formData.get("folder_id");
  const folderId = rawFolderId ? String(rawFolderId).trim() : null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const { page } = await uploadPage({
      file,
      userId: user.id,
      isPublic: true,
      folderId,
    });
    return NextResponse.json({ id: page.id }, { status: 200 });
  } catch (err) {
    console.error("[upload] failed", {
      code: err instanceof SourceValidationError ? err.code : "upload_failed",
      errorType: err instanceof Error ? err.name : "unknown",
    });
    const message = (err as Error).message;
    const status = err instanceof SourceValidationError && err.code === "file_too_large"
      ? 413
      : err instanceof SourceValidationError
        ? 400
        : 500;
    return NextResponse.json(
      { error: message, ...(err instanceof SourceValidationError ? { code: err.code } : {}) },
      { status }
    );
  }
}
