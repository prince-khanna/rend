"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewFolderButton({ parentId = null }: { parentId?: string | null }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function createFolder() {
    const name = window.prompt("Folder name");
    if (name === null) return;
    if (!name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id: parentId }),
      });
      const result = await response.json();
      if (!response.ok) {
        window.alert(result.error ?? "Folder could not be created.");
        return;
      }
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={createFolder}
      disabled={creating}
      className="btn-tonal"
      style={{ padding: "6px 10px", fontSize: "12px" }}
    >
      {creating ? "Creating…" : "+ folder"}
    </button>
  );
}
