create table catalog_media (
  path text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

insert into catalog_media (path, label)
select image_url, name
from items
where image_url is not null
on conflict (path) do nothing;

alter table catalog_media enable row level security;

create policy "Public users can read catalog media" on catalog_media
for select using (true);

create policy "Admins can manage catalog media" on catalog_media
for all to authenticated
using (is_admin())
with check (is_admin());
