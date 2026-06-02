"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { ThemeBootstrap } from "./ThemeBootstrap";
import type { Theme } from "@/lib/theme";

type Props = { name: string; email: string; initialTheme: Theme; children: React.ReactNode };

const NAV = [
  { href: "/dashboard", label: "Pages" },
  { href: "/settings",  label: "Settings" },
];

export function Sidebar({ name, email, initialTheme, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Rend
        </span>
        {/* Close button — mobile only */}
        <button
          className="sidebar-close-btn"
          onClick={() => setOpen(false)}
          style={{
            display: "none",
            background: "transparent",
            border: "none",
            color: "var(--muted)",
            fontSize: "18px",
            cursor: "pointer",
            padding: "0 4px",
            lineHeight: 1,
          }}
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 8px", flex: 1 }}>
        {NAV.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)} style={{
              display: "block",
              padding: "9px 12px",
              fontSize: "14px",
              fontWeight: active ? 600 : 400,
              color: active ? "var(--text)" : "var(--muted)",
              textDecoration: "none",
              background: active ? "var(--surface2)" : "transparent",
              borderRadius: "var(--radius-sm)",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              transition: "color var(--duration-fast) var(--ease-fluid), background var(--duration-fast) var(--ease-fluid), box-shadow var(--duration-std) var(--ease-fluid)",
            }}>
              {label}
            </Link>
          );
        })}
      </nav>

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
    </>
  );

  return (
    <div className="layout-shell">
      <ThemeBootstrap theme={initialTheme} />

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <span style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Rend
        </span>
        <button
          onClick={() => setOpen(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text)",
            fontSize: "20px",
            cursor: "pointer",
            padding: "4px 8px",
            lineHeight: 1,
          }}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`layout-aside${open ? " sidebar-open" : ""}`}
        style={{ borderRight: "1px solid var(--border)", position: "relative" }}
      >
        {sidebarContent}
      </aside>

      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}
