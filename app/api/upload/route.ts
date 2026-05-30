import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { uploadPage } from "@/lib/page-upload";

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

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const { page } = await uploadPage({
      file,
      userId: user.id,
      isPublic: true,
    });
    return NextResponse.json({ id: page.id }, { status: 200 });
  } catch (err) {
    console.error("[upload] error:", err);
    const message = (err as Error).message;
    const status = message.includes("Only .html and .md")
      ? 400
      : message.includes("5MB")
        ? 413
        : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
