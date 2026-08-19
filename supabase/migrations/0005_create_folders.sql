-- User-owned folder hierarchy for organizing Pages.
create table folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  parent_id   uuid references folders(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  created_at  timestamptz default now() not null
);

alter table folders enable row level security;

create policy "folder owner full access"
  on folders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Folder names are unique within one parent's children, case-insensitively.
create unique index folders_user_parent_name_idx
  on folders (user_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
create index folders_user_parent_idx on folders (user_id, parent_id);

alter table pages
  add column folder_id uuid references folders(id) on delete set null;

create index pages_user_folder_created_at_idx
  on pages (user_id, folder_id, created_at desc);
