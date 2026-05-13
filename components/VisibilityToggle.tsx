"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = { pageId: string; isPublic: boolean };

export function VisibilityToggle({ pageId, isPublic }: Props) {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(isPublic);
  const router = useRouter();

  async function toggle() {
    const next = !current;
    setCurrent(next);
    await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: next }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      style={{
        background: "transparent",
        border: `1px solid ${current ? "rgba(226,247,64,0.3)" : "var(--border-hover)"}`,
        color: current ? "var(--accent)" : "var(--muted)",
        padding: "5px 10px",
        fontSize: "11px",
        fontFamily: "var(--font-jetbrains)",
        cursor: pending ? "not-allowed" : "pointer",
        letterSpacing: "0.06em",
        transition: "all 0.15s",
        opacity: pending ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {current ? "public" : "private"}
    </button>
  );
}
