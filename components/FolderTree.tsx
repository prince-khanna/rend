"use client";

import Link from "next/link";
import type { Folder, Page } from "@/lib/types";
import { FileList } from "./FileList";
import { NewFolderButton } from "./NewFolderButton";

type Props = { folders: Folder[]; pages: Page[]; origin: string };

type FolderNodeProps = {
  folder: Folder;
  folders: Folder[];
  pages: Page[];
  origin: string;
  depth: number;
};

function FolderNode({ folder, folders, pages, origin, depth }: FolderNodeProps) {
  const children = folders.filter((candidate) => candidate.parent_id === folder.id);
  const folderPages = pages.filter((page) => page.folder_id === folder.id);

  return (
    <section style={{ marginLeft: `${depth * 20}px`, marginTop: "20px" }} aria-labelledby={`folder-${folder.id}`}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderRadius: "var(--radius-md)",
      }}>
        <span aria-hidden="true" style={{ color: "var(--accent)", fontSize: "16px" }}>▰</span>
        <h3 id={`folder-${folder.id}`} style={{ flex: 1, minWidth: 0, margin: 0, fontSize: "14px", fontWeight: 600 }}>
          {folder.name}
        </h3>
        <Link
          href={`/upload?folder=${encodeURIComponent(folder.id)}`}
          className="btn-accent"
          style={{ padding: "6px 10px", fontSize: "11px" }}
        >
          + upload
        </Link>
        <NewFolderButton parentId={folder.id} />
      </div>

      {folderPages.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          <FileList pages={folderPages} origin={origin} />
        </div>
      )}
      {children.map((child) => (
        <FolderNode
          key={child.id}
          folder={child}
          folders={folders}
          pages={pages}
          origin={origin}
          depth={depth + 1}
        />
      ))}
    </section>
  );
}

export function FolderTree({ folders, pages, origin }: Props) {
  const rootPages = pages.filter((page) => page.folder_id === null);
  const rootFolders = folders.filter((folder) => folder.parent_id === null);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          root
        </span>
        <NewFolderButton />
      </div>
      {rootPages.length > 0 && <FileList pages={rootPages} origin={origin} />}
      {rootFolders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          folders={folders}
          pages={pages}
          origin={origin}
          depth={0}
        />
      ))}
      {rootPages.length === 0 && rootFolders.length === 0 && <FileList pages={[]} origin={origin} />}
    </div>
  );
}
