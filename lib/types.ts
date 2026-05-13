export type Page = {
  id: string;
  user_id: string;
  name: string;
  storage_key: string;
  is_public: boolean;
  created_at: string;
  source_type: 'html' | 'markdown';
  source_key: string | null;
};
