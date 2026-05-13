alter table pages
  add column source_type text not null default 'html' check (source_type in ('html', 'markdown')),
  add column source_key  text;
