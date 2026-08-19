#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const supabase = createClient(url, serviceKey);
const { data: pages, error } = await supabase.from("pages").select("*");
if (error) throw error;

for (const page of pages ?? []) {
  const format = page.source_format ?? (page.source_type === "markdown" ? "md" : "html");
  const sourceKey = page.source_key ?? page.storage_key;
  const { data: blob, error: downloadError } = await supabase.storage.from("pages").download(sourceKey);
  if (downloadError || !blob) {
    console.error(JSON.stringify({ code: "metadata_backfill_source_missing", pageId: page.id }));
    continue;
  }
  const bytes = Buffer.from(await blob.arrayBuffer());
  const digest = createHash("sha256").update(bytes).digest("hex");
  const { error: updateError } = await supabase.from("pages").update({
    source_family: page.source_family ?? page.source_type,
    source_format: format,
    original_filename: page.original_filename ?? (/\.(html?|md)$/i.test(page.name) ? page.name : `${page.name}.${format}`),
    byte_size: bytes.byteLength,
    source_digest: digest,
    source_key: sourceKey,
    rendered_key: page.rendered_key ?? page.storage_key,
  }).eq("id", page.id);
  if (updateError) {
    console.error(JSON.stringify({ code: "metadata_backfill_update_failed", pageId: page.id }));
  } else {
    console.log(JSON.stringify({ code: "metadata_backfilled", pageId: page.id, byteSize: bytes.byteLength }));
  }
}
