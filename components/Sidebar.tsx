"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ThemeBootstrap } from "./ThemeBootstrap";
import type { Theme } from "@/lib/theme";

type Props = { name: string; email: string; initialTheme: Theme; children: React.ReactNode };

const NAV = [
  { href: "/dashboard", label: "Pages" },
];

export function Sidebar({ name, email, initialTheme, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <ThemeBootstrap theme={initialTheme} />
      {/* Sidebar */}
      <aside style={{
        width: "200px",
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Rend
          </span>
        </div>

        {/* Main nav */}
        <nav style={{ padding: "12px 8px", flex: 1 }}>
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: "block",
                padding: "9px 12px",
                fontSize: "14px",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--text)" : "var(--muted)",
                textDecoration: "none",
                background: active ? "var(--surface2)" : "transparent",
                borderLeft: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                transition: "color 0.15s, background 0.15s",
              }}>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — settings + email + logout */}
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 8px 8px" }}>
          {/* Settings link */}
          <Link href="/settings" style={{
            display: "block",
            padding: "9px 12px",
            fontSize: "14px",
            fontWeight: pathname === "/settings" ? 600 : 400,
            color: pathname === "/settings" ? "var(--text)" : "var(--muted)",
            textDecoration: "none",
            background: pathname === "/settings" ? "var(--surface2)" : "transparent",
            borderLeft: `2px solid ${pathname === "/settings" ? "var(--accent)" : "transparent"}`,
            transition: "color 0.15s, background 0.15s",
            marginBottom: "4px",
          }}>
            Settings
          </Link>
        </div>

        {/* Email + logout */}
        <div style={{
          padding: "12px 20px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}>
          <span style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: "11px",
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 500,
          }}>
            {name || email}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontSize: "12px",
              fontFamily: "var(--font-jetbrains)",
              cursor: "pointer",
              padding: 0,
              textAlign: "left",
              transition: "color 0.15s",
              letterSpacing: "0.04em",
            }}
            onMouseOver={e => (e.currentTarget.style.color = "var(--danger)")}
            onMouseOut={e => (e.currentTarget.style.color = "var(--muted)")}
          >
            sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
