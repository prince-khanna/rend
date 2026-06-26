import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getPageById } from "@/lib/pages";
import { HtmlFrame } from "@/components/HtmlFrame";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { VisibilityToggle } from "@/components/VisibilityToggle";
import { DeleteButton } from "@/components/DeleteButton";
import { RenamePageButton } from "@/components/RenamePageButton";

type Props = { params: Promise<{ id: string }> };

export default async function PageView({ params }: Props) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const page = await getPageById(id);
  if (!page) notFound();

  const isOwner = user?.id === page.user_id;
  if (!page.is_public && !isOwner) notFound();

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const pageUrl = `${protocol}://${host}/pages/${id}`;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <header style={{
        height: "44px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "0 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
      }}>
        {isOwner && (
          <Link href="/dashboard" style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: "12px",
            color: "var(--muted)",
            textDecoration: "none",
            paddingRight: "12px",
            borderRight: "1px solid var(--border)",
            transition: "color 0.15s",
            flexShrink: 0,
          }}>
            ← pigeon
          </Link>
        )}

        {/* Page name */}
        <span style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: "12px",
          color: "var(--text)",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {page.name}
        </span>

        {/* Visibility pill */}
        {!isOwner && (
          <span style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: "10px",
            color: "var(--muted)",
            letterSpacing: "0.08em",
            border: "1px solid var(--border)",
            padding: "3px 7px",
          }}>
            public
          </span>
        )}

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <CopyLinkButton url={pageUrl} />
          {isOwner && (
            <>
              <RenamePageButton pageId={page.id} currentName={page.name} />
              <VisibilityToggle pageId={page.id} isPublic={page.is_public} />
              <DeleteButton pageId={page.id} />
            </>
          )}
        </div>
      </header>

      <HtmlFrame src={`/api/render/${id}`} />
    </div>
  );
}
