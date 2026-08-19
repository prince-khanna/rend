import { createServerSupabaseClient, createServiceRoleClient } from "./supabase-server";
import type { Folder } from "./types";

export async function insertFolder(
  folder: Omit<Folder, "created_at">,
  options: { serviceRole?: boolean } = {}
): Promise<Folder> {
  const supabase = options.serviceRole
    ? createServiceRoleClient()
    : await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("folders")
    .insert(folder)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listFoldersByUser(
  userId: string,
  options: { serviceRole?: boolean } = {}
): Promise<Folder[]> {
  const supabase = options.serviceRole
    ? createServiceRoleClient()
    : await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFolderById(
  id: string,
  options: { serviceRole?: boolean } = {}
): Promise<Folder | null> {
  const supabase = options.serviceRole
    ? createServiceRoleClient()
    : await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}
