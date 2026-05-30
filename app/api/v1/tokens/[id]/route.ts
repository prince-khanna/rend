import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { deleteApiToken } from "@/lib/api-tokens";

type Params = { params: Promise<{ id: string }> };

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("unauthorized", "You must be logged in.", 401);
  }

  try {
    await deleteApiToken(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/v1/tokens] delete error:", err);
    return apiError("token_store_unavailable", "API token storage is not available.", 500);
  }
}
