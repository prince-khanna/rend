-- Durable source metadata. storage_key remains the rendered-object key for
-- compatibility; source_key points at the exact uploaded source for new Pages.
alter table pages drop constraint if exists pages_source_type_check;
alter table pages
  add constraint pages_source_type_check
  check (source_type in ('html', 'markdown', 'data', 'script', 'html_project')),
  add column source_family text,
  add column source_format text,
  add column original_filename text,
  add column byte_size bigint,
  add column source_digest text,
  add column rendered_key text,
  add column project_asset_keys text[] not null default '{}';

-- Deterministic metadata for existing records. Existing storage objects are
-- retained and remain the render object. A deployment backfill should fill
-- byte_size/source_digest from the retained object bytes; they are nullable
-- during the compatibility migration because SQL cannot read Storage bodies.
update pages
set
  source_family = case when source_type = 'markdown' then 'markdown' else 'html' end,
  source_format = case when source_type = 'markdown' then 'md' else 'html' end,
  original_filename = case
    when name ~* E'\\.(html?|md)$' then name
    else name || case when source_type = 'markdown' then '.md' else '.html' end
  end,
  rendered_key = storage_key
where source_family is null;

alter table pages
  add constraint pages_source_family_check
  check (source_family is null or source_family in ('html', 'markdown', 'data', 'script', 'html_project')),
  add constraint pages_source_format_check
  check (source_format is null or source_format in (
    'html', 'htm', 'md', 'markdown', 'json', 'yaml', 'yml',
    'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'py', 'sh', 'bash',
    'zsh', 'ps1', 'rb', 'php', 'zip'
  )),
  add constraint pages_byte_size_check check (byte_size is null or byte_size >= 0),
  add constraint pages_source_digest_check check (
    source_digest is null or source_digest ~ '^[0-9a-f]{64}$'
  );

create index pages_user_created_at_idx on pages (user_id, created_at desc);
