import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Sidebar } from "@/components/Sidebar";
import { UploadForm } from "@/components/UploadForm";
import { redirect } from "next/navigation";
import type { Theme } from "@/lib/theme";

export default async function UploadPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const initialTheme = (user.user_metadata?.theme ?? "dark") as Theme;
  const displayName  = (user.user_metadata?.display_name ?? "") as string;

  return (
    <Sidebar name={displayName} email={user.email ?? ""} initialTheme={initialTheme}>
      <div style={{
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
      }}>
        <div style={{ width: "100%", maxWidth: "520px" }}>
          <div style={{ marginBottom: "36px" }}>
            <p style={{
              fontFamily: "var(--font-jetbrains)",
              fontSize: "11px",
              color: "var(--accent)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}>
              New page
            </p>
            <h1 style={{ fontWeight: 800, fontSize: "32px", letterSpacing: "-0.02em", margin: 0 }}>
              Drop your HTML
            </h1>
            <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
              Upload a .html file — it will be publicly accessible immediately.
            </p>
          </div>
          <UploadForm />
        </div>
      </div>
    </Sidebar>
  );
}
