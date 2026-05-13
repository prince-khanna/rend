create table pages (
  id          uuid primary key,
  user_id     uuid references auth.users not null,
  name        text not null,
  storage_key text not null,
  is_public   boolean default true not null,
  created_at  timestamptz default now() not null
);

alter table pages enable row level security;

-- Owner full access
create policy "owner full access"
  on pages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone can read public pages
create policy "public read"
  on pages for select
  using (is_public = true);
