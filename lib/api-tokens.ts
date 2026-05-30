import { createHash, randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "./supabase-server";

export type ApiToken = {
  id: string;
  user_id: string;
  name: string;
  token_prefix: string;
  token_hash: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export type PublicApiToken = Omit<ApiToken, "token_hash" | "user_id">;

const TOKEN_PREFIX = "rnd_live_";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toPublicToken(token: ApiToken): PublicApiToken {
  return {
    id: token.id,
    name: token.name,
    token_prefix: token.token_prefix,
    last_used_at: token.last_used_at,
    expires_at: token.expires_at,
    created_at: token.created_at,
  };
}

export function generateRawApiToken() {
  return `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export async function listApiTokens(userId: string): Promise<PublicApiToken[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("api_tokens")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ApiToken[]).map(toPublicToken);
}

export async function createApiToken(
  userId: string,
  name: string,
  expiresAt: string | null
): Promise<{ token: PublicApiToken; rawToken: string }> {
  const rawToken = generateRawApiToken();
  const tokenHash = hashToken(rawToken);
  const tokenPrefix = rawToken.slice(0, 18);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("api_tokens")
    .insert({
      user_id: userId,
      name,
      token_prefix: tokenPrefix,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return { token: toPublicToken(data as ApiToken), rawToken };
}

export async function deleteApiToken(id: string, userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("api_tokens")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function authenticateApiRequest(
  request: NextRequest
): Promise<{ userId: string; token: PublicApiToken } | { error: string; status: number }> {
  const auth = request.headers.get("authorization") ?? "";
  const [scheme, rawToken] = auth.split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer" || !rawToken) {
    return { error: "Missing bearer token", status: 401 };
  }

  if (!rawToken.startsWith(TOKEN_PREFIX)) {
    return { error: "Invalid bearer token", status: 401 };
  }

  let supabase: ReturnType<typeof createServiceRoleClient>;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return { error: "API token auth is not configured", status: 500 };
  }
  const tokenHash = hashToken(rawToken);
  const { data, error } = await supabase
    .from("api_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !data) {
    return { error: "Invalid bearer token", status: 401 };
  }

  const token = data as ApiToken;
  if (token.expires_at && Date.parse(token.expires_at) <= Date.now()) {
    return { error: "Bearer token expired", status: 401 };
  }

  await supabase
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", token.id);

  return { userId: token.user_id, token: toPublicToken(token) };
}
