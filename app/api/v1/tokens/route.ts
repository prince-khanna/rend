import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createApiToken, listApiTokens } from "@/lib/api-tokens";

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("unauthorized", "You must be logged in.", 401);
  }

  try {
    const tokens = await listApiTokens(user.id);
    return NextResponse.json({ tokens });
  } catch (err) {
    console.error("[api/v1/tokens] list error:", err);
    return apiError("token_store_unavailable", "API token storage is not available.", 500);
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("unauthorized", "You must be logged in.", 401);
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const expiresAt = body.expires_at ? String(body.expires_at) : null;

  if (!name) {
    return apiError("name_required", "Token name is required.", 400);
  }

  if (name.length > 80) {
    return apiError("name_too_long", "Token name must be 80 characters or fewer.", 400);
  }

  if (expiresAt && Number.isNaN(Date.parse(expiresAt))) {
    return apiError("invalid_expiry", "expires_at must be an ISO date string.", 400);
  }

  try {
    const { token, rawToken } = await createApiToken(user.id, name, expiresAt);
    return NextResponse.json({ token, raw_token: rawToken }, { status: 201 });
  } catch (err) {
    console.error("[api/v1/tokens] create error:", err);
    return apiError("token_store_unavailable", "API token storage is not available.", 500);
  }
}
