import { createServerSupabaseClient } from "@/lib/supabase-server";
import { listFoldersByUser } from "@/lib/folders";
import { Sidebar } from "@/components/Sidebar";
import { UploadForm } from "@/components/UploadForm";
import { redirect } from "next/navigation";
import type { Theme } from "@/lib/theme";

type Props = { searchParams: Promise<{ folder?: string }> };

export default async function UploadPage({ searchParams }: Props) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [folders, params] = await Promise.all([
    listFoldersByUser(user.id),
    searchParams,
  ]);
  const initialFolderId = params.folder && folders.some((folder) => folder.id === params.folder)
    ? params.folder
    : null;
  const initialTheme = (user.user_metadata?.theme ?? "dark") as Theme;
  const displayName  = (user.user_metadata?.display_name ?? "") as string;

  return (
    <Sidebar name={displayName} email={user.email ?? ""} initialTheme={initialTheme}>
      <div className="page-pad" style={{
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
              Drop your file
            </h1>
            <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
              Upload HTML, Markdown, JSON, YAML, or a supported script. Choose a destination folder before uploading; browser uploads are public immediately and data/script previews never execute source.
            </p>
          </div>
          <UploadForm folders={folders} initialFolderId={initialFolderId} />
        </div>
      </div>
    </Sidebar>
  );
}
