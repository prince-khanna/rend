import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Sidebar } from "@/components/Sidebar";
import { SettingsForm } from "@/components/SettingsForm";
import { ApiTokenManager } from "@/components/ApiTokenManager";
import { redirect } from "next/navigation";
import type { Theme } from "@/lib/theme";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName   = (user.user_metadata?.display_name ?? "") as string;
  const initialTheme  = (user.user_metadata?.theme ?? "dark") as Theme;

  return (
    <Sidebar name={displayName} email={user.email ?? ""} initialTheme={initialTheme}>
      <div style={{ padding: "40px", maxWidth: "560px" }}>
        <div style={{ marginBottom: "36px" }}>
          <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "10px" }}>
            Account
          </p>
          <h1 style={{ fontWeight: 800, fontSize: "28px", letterSpacing: "-0.02em", margin: 0 }}>Settings</h1>
        </div>
        <SettingsForm initialEmail={user.email ?? ""} initialName={displayName} initialTheme={initialTheme} />
        <ApiTokenManager />
      </div>
    </Sidebar>
  );
}
