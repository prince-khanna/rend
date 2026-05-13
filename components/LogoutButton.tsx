"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: "transparent",
        border: "none",
        color: "var(--muted)",
        fontSize: "12px",
        fontFamily: "var(--font-jetbrains)",
        cursor: "pointer",
        padding: "0",
        transition: "color 0.15s",
        letterSpacing: "0.04em",
      }}
      onMouseOver={e => (e.currentTarget.style.color = "var(--text)")}
      onMouseOut={e => (e.currentTarget.style.color = "var(--muted)")}
    >
      sign out
    </button>
  );
}
