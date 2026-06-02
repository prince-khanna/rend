"use client";

import { useRouter } from "next/navigation";

type Props = { pageId: string };

export function DeleteButton({ pageId }: Props) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    await fetch(`/api/pages/${pageId}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      aria-label="Delete page"
      style={{
        background: "transparent",
        border: "1px solid transparent",
        color: "var(--muted)",
        padding: "5px 8px",
        fontSize: "14px",
        cursor: "pointer",
        transition: "color 0.15s, border-color 0.15s",
        lineHeight: 1,
        fontFamily: "var(--font-jetbrains)",
      }}
      onMouseOver={e => {
        e.currentTarget.style.color = "var(--danger)";
        e.currentTarget.style.borderColor = "rgba(232,80,64,0.3)";
      }}
      onMouseOut={e => {
        e.currentTarget.style.color = "var(--muted)";
        e.currentTarget.style.borderColor = "transparent";
      }}
      title="Delete page"
    >
      ×
    </button>
  );
}
