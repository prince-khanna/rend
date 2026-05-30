create extension if not exists pgcrypto;

create table api_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade not null,
  name          text not null,
  token_prefix  text not null,
  token_hash    text unique not null,
  last_used_at  timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz default now() not null
);

alter table api_tokens enable row level security;

create policy "owner can read api tokens"
  on api_tokens for select
  using (auth.uid() = user_id);

create policy "owner can create api tokens"
  on api_tokens for insert
  with check (auth.uid() = user_id);

create policy "owner can delete api tokens"
  on api_tokens for delete
  using (auth.uid() = user_id);
