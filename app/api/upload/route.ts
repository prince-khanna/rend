import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { uploadFile } from "@/lib/storage";
import { insertPage } from "@/lib/pages";
import { randomUUID } from "crypto";
import { marked } from "marked";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function wrapMarkdownHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown-light.min.css" />
  <style>
    body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 45px; }
    @media (max-width: 767px) { body { padding: 15px; } }
  </style>
</head>
<body class="markdown-body">
${bodyHtml}
</body>
</html>`;
}

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

  const isHtml = file.name.endsWith(".html");
  const isMarkdown = file.name.endsWith(".md");

  if (!isHtml && !isMarkdown) {
    return NextResponse.json(
      { error: "Only .html and .md files are accepted" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 5MB limit" },
      { status: 400 }
    );
  }

  const id = randomUUID();
  const storageKey = `${user.id}/${id}.html`;
  const name = file.name.replace(/\.(html|md)$/i, "");

  let fileToStore: Blob;
  let sourceKey: string | null = null;

  if (isMarkdown) {
    const rawText = await file.text();
    const bodyHtml = await marked(rawText);
    const fullHtml = wrapMarkdownHtml(bodyHtml);
    fileToStore = new Blob([fullHtml], { type: "text/html" });
    sourceKey = `${user.id}/${id}.md`;
  } else {
    fileToStore = file;
  }

  try {
    await uploadFile(storageKey, fileToStore, "text/html");
    if (sourceKey) {
      await uploadFile(sourceKey, file, "text/markdown");
    }
  } catch (err) {
    console.error("[upload] storage error:", err);
    return NextResponse.json(
      { error: "Storage upload failed: " + (err as Error).message },
      { status: 500 }
    );
  }

  try {
    await insertPage({
      id,
      user_id: user.id,
      name,
      storage_key: storageKey,
      is_public: true,
      source_type: isMarkdown ? "markdown" : "html",
      source_key: sourceKey,
    });
  } catch (err) {
    console.error("[upload] db error:", err);
    return NextResponse.json(
      { error: "DB insert failed: " + (err as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({ id }, { status: 200 });
}
