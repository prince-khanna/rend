"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ACCEPTED_EXTENSIONS = [
  ".html", ".htm", ".md", ".markdown", ".json", ".yaml", ".yml", ".zip",
  ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".py", ".sh", ".bash", ".zsh", ".ps1", ".rb", ".php",
];
const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",");

export function UploadForm() {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function submit(file: File) {
    setError(null);
    const lowerName = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
      setError("Unsupported source. Choose HTML, Markdown, JSON, YAML, a supported script, or a constrained HTML project ZIP.");
      return;
    }
    if (file.size === 0) { setError("Source cannot be empty."); return; }
    const isProject = lowerName.endsWith(".zip");
    if (file.size > (isProject ? 20 : 5) * 1024 * 1024) {
      setError(`File exceeds the ${isProject ? "20 MiB project archive" : "5 MiB source"} limit.`);
      return;
    }

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
          background: dragging ? "oklch(93% 0.21 114 / 0.06)" : "var(--surface)",
          cursor: "pointer",
          padding: "60px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          borderRadius: "var(--radius-lg)",
          boxShadow: dragging ? "var(--shadow-accent)" : "var(--shadow-sm)",
          transition: "border-color var(--duration-fast) var(--ease-fluid), background var(--duration-fast) var(--ease-fluid), box-shadow var(--duration-std) var(--ease-fluid)",
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
              borderRadius: "var(--radius-md)",
              background: "var(--surface2)",
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
                Drop a supported Page source here
              </p>
              <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                or click to browse · HTML, Markdown, JSON, YAML, scripts, or a static HTML ZIP project
              </p>
            </div>
          </>
        )}
        <input ref={inputRef} type="file" accept={ACCEPT_ATTRIBUTE} style={{ display: "none" }} onChange={onChange} />
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
