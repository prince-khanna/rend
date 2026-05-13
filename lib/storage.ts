import { createServiceRoleClient } from "./supabase-server";

const BUCKET = "pages";

export async function uploadFile(
  storageKey: string,
  file: File | Blob,
  contentType = "text/html"
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, file, { contentType, upsert: false });
  if (error) throw new Error(error.message);
}

export async function deleteFile(storageKey: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(BUCKET).remove([storageKey]);
  if (error) throw new Error(error.message);
}

export async function deleteFiles(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(BUCKET).remove(keys);
  if (error) throw new Error(error.message);
}

export async function getSignedUrl(storageKey: string): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storageKey, 60 * 60); // 1 hour
  if (error || !data) throw new Error(error?.message ?? "Failed to sign URL");
  return data.signedUrl;
}

export function getPublicUrl(storageKey: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${url}/storage/v1/object/public/${BUCKET}/${storageKey}`;
}

export async function setFilePublic(
  storageKey: string,
  isPublic: boolean
): Promise<void> {
  void storageKey;
  void isPublic;
}
