-- Editable site content (CMS-lite). Key/value rows power the public landing
-- page; the admin Content editor writes here. DDL — run in the SQL editor.

create table if not exists site_content (
  key        text primary key,
  grp        text not null default 'General',
  label      text not null default '',
  type       text not null default 'text',  -- text | textarea | image
  value      text,
  sort       int  not null default 0,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

-- Public can read content (it's shown on the website); only staff can edit.
drop policy if exists "public read site_content" on site_content;
create policy "public read site_content" on site_content for select using (true);

drop policy if exists "staff manage site_content" on site_content;
create policy "staff manage site_content" on site_content
  for all using (is_staff()) with check (is_staff());
