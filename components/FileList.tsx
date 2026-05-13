"use client";

import Link from "next/link";
import type { Page } from "@/lib/types";
import { VisibilityToggle } from "./VisibilityToggle";
import { CopyLinkButton } from "./CopyLinkButton";
import { DeleteButton } from "./DeleteButton";

type Props = { pages: Page[]; origin: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function FileList({ pages, origin }: Props) {
  if (pages.length === 0) {
    return (
      <div style={{
        border: "1px dashed var(--border-hover)",
        padding: "64px 40px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}>
        <p style={{ fontSize: "15px", color: "var(--muted)" }}>No pages yet</p>
        <Link href="/upload" style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: "12px",
          color: "var(--accent)",
          textDecoration: "none",
          letterSpacing: "0.06em",
        }}>
          Upload your first page →
        </Link>
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
      {pages.map((page, i) => (
        <li
          key={page.id}
          className="animate-fade-up"
          style={{
            animationDelay: `${i * 0.04}s`,
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "14px 16px",
            background: "var(--surface)",
            borderLeft: "2px solid transparent",
            transition: "border-color 0.15s, background 0.15s",
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLElement).style.borderLeftColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.background = "var(--surface2)";
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent";
            (e.currentTarget as HTMLElement).style.background = "var(--surface)";
          }}
        >
          {/* Name + date */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/pages/${page.id}`} style={{ textDecoration: "none" }}>
              <span style={{
                fontFamily: "var(--font-jetbrains)",
                fontSize: "13px",
                color: "var(--text)",
                fontWeight: 500,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {page.name}
              </span>
            </Link>
            <span style={{
              fontFamily: "var(--font-jetbrains)",
              fontSize: "11px",
              color: "var(--muted)",
              marginTop: "2px",
              display: "block",
            }}>
              {formatDate(page.created_at)}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <VisibilityToggle pageId={page.id} isPublic={page.is_public} />
            {page.is_public && <CopyLinkButton url={`${origin}/pages/${page.id}`} />}
            <DeleteButton pageId={page.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}
