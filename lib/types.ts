export type SourceFamily = "html" | "markdown" | "data" | "script" | "html_project";

export type SourceFormat =
  | "html" | "htm" | "md" | "markdown"
  | "json" | "yaml" | "yml"
  | "js" | "mjs" | "cjs" | "ts" | "tsx" | "jsx"
  | "py" | "sh" | "bash" | "zsh" | "ps1" | "rb" | "php"
  | "zip";

export type Folder = {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
};

export type Page = {
  id: string;
  user_id: string;
  name: string;
  storage_key: string;
  is_public: boolean;
  created_at: string;
  /** Legacy field retained for compatibility with the first migrations. */
  source_type: SourceFamily;
  /** Exact uploaded source object. Null only for legacy rows without one. */
  source_key: string | null;
  source_family: SourceFamily | null;
  source_format: SourceFormat | null;
  original_filename: string | null;
  byte_size: number | null;
  source_digest: string | null;
  rendered_key: string | null;
  project_asset_keys: string[] | null;
  folder_id: string | null;
};
