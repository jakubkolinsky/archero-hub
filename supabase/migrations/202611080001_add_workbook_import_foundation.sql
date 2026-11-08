create table workbook_imports (
  id uuid primary key default gen_random_uuid(),
  catalog_source_id uuid not null references catalog_sources(id) on delete cascade,
  filename text not null unique,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table workbook_sheets (
  id uuid primary key default gen_random_uuid(),
  workbook_import_id uuid not null references workbook_imports(id) on delete cascade,
  name text not null,
  row_count integer not null check (row_count >= 0),
  header_values jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (workbook_import_id, name)
);

create table workbook_rows (
  id uuid primary key default gen_random_uuid(),
  workbook_sheet_id uuid not null references workbook_sheets(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  cell_values jsonb not null,
  created_at timestamptz not null default now(),
  unique (workbook_sheet_id, row_number)
);

create table hero_bonus_milestones (
  id uuid primary key default gen_random_uuid(),
  hero_id uuid not null references items(id) on delete cascade,
  milestone text not null,
  effect text not null,
  source_record_id uuid not null references source_records(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (hero_id, milestone, effect)
);

create index workbook_sheets_import_idx on workbook_sheets (workbook_import_id);
create index workbook_rows_sheet_idx on workbook_rows (workbook_sheet_id, row_number);
create index hero_bonus_milestones_hero_idx on hero_bonus_milestones (hero_id);

alter table workbook_imports enable row level security;
alter table workbook_sheets enable row level security;
alter table workbook_rows enable row level security;
alter table hero_bonus_milestones enable row level security;

create policy "Public users can read workbook imports" on workbook_imports
for select using (true);

create policy "Public users can read workbook sheets" on workbook_sheets
for select using (true);

create policy "Public users can read verified hero bonus milestones" on hero_bonus_milestones
for select using (
  exists (
    select 1
    from source_records
    where source_records.id = hero_bonus_milestones.source_record_id
      and source_records.review_status = 'verified'
  )
);

create policy "Admins can manage workbook imports" on workbook_imports
for all to authenticated using (is_admin()) with check (is_admin());

create policy "Admins can manage workbook sheets" on workbook_sheets
for all to authenticated using (is_admin()) with check (is_admin());

create policy "Admins can manage workbook rows" on workbook_rows
for all to authenticated using (is_admin()) with check (is_admin());

create policy "Admins can manage hero bonus milestones" on hero_bonus_milestones
for all to authenticated using (is_admin()) with check (is_admin());

insert into catalog_sources (
  name,
  source_url,
  source_version,
  status,
  attribution
) values (
  'User-supplied Archero workbooks',
  'local://archero-workbooks',
  '2026-11-08',
  'current',
  'User-provided workbook collection. Values require curator review before public calculation use.'
)
on conflict (name) do update
set
  source_version = excluded.source_version,
  status = excluded.status,
  attribution = excluded.attribution;

with workbook_data (filename, sha256) as (
  values
    ('Archero - Dragon Statues.xlsx', '0c86047981c56e197e4540710a3d9d2fe9a63f82c384ea2f6b65ed4605080e95'),
    ('Archero All Hero bonuses.xlsx', '9175159da225cee11e6da82a2492bf2165c2cc3c6441d8d257eb5f3dee87284d'),
    ('Archero Glyphs.xlsx', '39876310fa9d2cbf795b9532ef9ce1fe883c08835aa403449d2a5c4a2a46718d'),
    ('Archero Hatchery 4.8.4 (LanderZ, mrb, Shusaku, Abstrusity, LuhCaran).xlsx', '44381ff0e8a139c254282e5f46906246c3b4c0afbf59f11edbb481587d1c9935'),
    ('Archero Jewels.xlsx', 'fb6a07979f640da75b474c30522fd6c1bad1066fd8a576cdaf9f1d049777ce0c'),
    ('Archero Medals.xlsx', 'f8acbe0ab75e48188a5a55e3dfc7e2f79ee0bccb264626c97e820b7b4b5c5fbd'),
    ('Archero Outfit stats.xlsx', '3999324d95bc6dfbad888d3b88de1f495e7392a0ca049e35545c7a1b6f9a8811'),
    ('Archero Pets.xlsx', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c'),
    ('Archero Relics.xlsx', '5327368f79a33c1d15272c77e6dafe01e111d49d3c3884f6d94bcec2cf477819'),
    ('Archero Sigils.xlsx', '429beb2a67bb04829cc508acc32927b5f89e1c7d94df2145d0000f93e6321808'),
    ('Archero Workers, Estate.xlsx', 'c78d56ad6b8be09a9fdaad895616bede2f9be555591101274099a932f2dbef8d'),
    ('Archero.xlsx', '402e6bfbe6b02c7a1550014cd64d26fd146bf3efa6cd982c3ddcff12ee8a338b'),
    ('Assist Brave Hero List (LuhCaran, Sloth, Kyle, Chaos).xlsx', 'eef9fe7113cc887de0e13e626f5ace5f62f7879ada2f72446f3c989ec7116777'),
    ('QuickRaid 5.11 (LuhCaran, Pelmens, zkn).xlsx', 'cd4bb3d9b4a1d4f40b7c35e334f80e3feb39774cb88326154e17166af27b0618')
)
insert into workbook_imports (catalog_source_id, filename, sha256)
select catalog_sources.id, workbook_data.filename, workbook_data.sha256
from workbook_data
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
on conflict (filename) do update
set sha256 = excluded.sha256;
