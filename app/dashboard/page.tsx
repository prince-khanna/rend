import Link from "next/link";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { listPagesByUser } from "@/lib/pages";
import { FileList } from "@/components/FileList";
import { Sidebar } from "@/components/Sidebar";
import { redirect } from "next/navigation";
import type { Theme } from "@/lib/theme";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pages = await listPagesByUser(user.id);
  const initialTheme  = (user.user_metadata?.theme ?? "dark") as Theme;
  const displayName   = (user.user_metadata?.display_name ?? "") as string;

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const origin = `${protocol}://${host}`;

  return (
    <Sidebar name={displayName} email={user.email ?? ""} initialTheme={initialTheme}>
      <div style={{ padding: "40px" }}>
        {/* Pages header + upload */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <h2 style={{ fontWeight: 700, fontSize: "20px", letterSpacing: "-0.01em", margin: 0 }}>
              Pages
            </h2>
            <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)" }}>
              {pages.length} {pages.length === 1 ? "page" : "pages"}
            </span>
          </div>
          <Link href="/upload" className="btn-accent" style={{ padding: "7px 16px", fontSize: "13px" }}>
            + Upload
          </Link>
        </div>

        <FileList pages={pages} origin={origin} />
      </div>
    </Sidebar>
  );
}
