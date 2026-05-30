import { createServerSupabaseClient, createServiceRoleClient } from "./supabase-server";
import type { Page } from "./types";

export async function insertPage(
  page: Omit<Page, "created_at">,
  options: { serviceRole?: boolean } = {}
): Promise<Page> {
  const supabase = options.serviceRole
    ? createServiceRoleClient()
    : await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pages")
    .insert(page)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listPagesByUser(userId: string): Promise<Page[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPageById(
  id: string,
  options: { serviceRole?: boolean } = {}
): Promise<Page | null> {
  const supabase = options.serviceRole
    ? createServiceRoleClient()
    : await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function togglePageVisibility(
  id: string,
  userId: string,
  isPublic: boolean
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("pages")
    .update({ is_public: isPublic })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function renamePage(
  id: string,
  userId: string,
  name: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("pages")
    .update({ name })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function deletePage(
  id: string,
  userId: string,
  options: { serviceRole?: boolean } = {}
): Promise<void> {
  const supabase = options.serviceRole
    ? createServiceRoleClient()
    : await createServerSupabaseClient();
  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
