"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function UploadForm() {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function submit(file: File) {
    setError(null);
    if (!file.name.endsWith(".html") && !file.name.endsWith(".md")) { setError("Only .html and .md files are accepted."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("File exceeds 5MB limit."); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();
    setUploading(false);

    if (!res.ok) { setError(json.error ?? "Upload failed."); return; }
    router.push(`/pages/${json.id}`);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) submit(file);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) submit(file);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1px dashed ${dragging ? "var(--accent)" : "var(--border-hover)"}`,
          background: dragging ? "rgba(226,247,64,0.04)" : "var(--surface)",
          cursor: "pointer",
          padding: "60px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        {uploading ? (
          <>
            <div style={{
              width: "32px",
              height: "32px",
              border: "2px solid var(--border)",
              borderTop: "2px solid var(--accent)",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "12px", color: "var(--muted)" }}>
              Uploading…
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: "44px",
              height: "44px",
              border: "1px solid var(--border-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              fontSize: "20px",
            }}>
              +
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "var(--text)", fontWeight: 500 }}>
                Drop .html or .md file here
              </p>
              <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                or click to browse · max 5MB
              </p>
            </div>
          </>
        )}
        <input ref={inputRef} type="file" accept=".html,.md" style={{ display: "none" }} onChange={onChange} />
      </div>

      {error && (
        <p style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: "12px",
          color: "var(--danger)",
          padding: "10px 12px",
          background: "rgba(232,80,64,0.08)",
          border: "1px solid rgba(232,80,64,0.2)",
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
