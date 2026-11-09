create table glyph_source_rows (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  equipment_category text not null,
  source_row_number integer not null check (source_row_number > 0),
  rarity_label text not null,
  glyph_name text not null,
  cell_values jsonb not null
);

alter table glyph_source_rows enable row level security;

create policy "Admins can manage glyph source rows" on glyph_source_rows
for all to authenticated using (is_admin()) with check (is_admin());

with glyph_rows as (
  select
    workbook_imports.catalog_source_id,
    workbook_imports.sha256,
    workbook_sheets.name as equipment_category,
    workbook_rows.row_number,
    workbook_rows.cell_values,
    coalesce(workbook_rows.cell_values ->> 'A', '') as rarity_label,
    coalesce(
      nullif(workbook_rows.cell_values ->> 'H', ''),
      nullif(workbook_rows.cell_values ->> 'B', ''),
      nullif(workbook_rows.cell_values ->> 'I', '')
    ) as glyph_name
  from workbook_imports
  join workbook_sheets on workbook_sheets.workbook_import_id = workbook_imports.id
  join workbook_rows on workbook_rows.workbook_sheet_id = workbook_sheets.id
  where workbook_imports.filename = 'Archero Glyphs.xlsx'
    and workbook_sheets.name in ('Weapon', 'Armor', 'Bracelet', 'Locket', 'Ring', 'Book', 'Spirit')
    and workbook_rows.row_number > 2
    and (
      workbook_rows.cell_values ? 'H'
      or workbook_rows.cell_values ? 'B'
      or workbook_rows.cell_values ? 'I'
    )
),
source_rows as (
  select
    catalog_source_id,
    'workbook:Archero Glyphs.xlsx:sheet:' || equipment_category || ':row:' || row_number as external_key,
    sha256 || ':row:' || row_number as source_fingerprint
  from glyph_rows
)
insert into source_records (catalog_source_id, external_key, entity_type, source_fingerprint)
select catalog_source_id, external_key, 'glyph_source_row', source_fingerprint
from source_rows
on conflict (catalog_source_id, external_key, entity_type) do update
set source_fingerprint = excluded.source_fingerprint;

with glyph_rows as (
  select
    workbook_imports.catalog_source_id,
    workbook_sheets.name as equipment_category,
    workbook_rows.row_number,
    workbook_rows.cell_values,
    coalesce(workbook_rows.cell_values ->> 'A', '') as rarity_label,
    coalesce(
      nullif(workbook_rows.cell_values ->> 'H', ''),
      nullif(workbook_rows.cell_values ->> 'B', ''),
      nullif(workbook_rows.cell_values ->> 'I', '')
    ) as glyph_name
  from workbook_imports
  join workbook_sheets on workbook_sheets.workbook_import_id = workbook_imports.id
  join workbook_rows on workbook_rows.workbook_sheet_id = workbook_sheets.id
  where workbook_imports.filename = 'Archero Glyphs.xlsx'
    and workbook_sheets.name in ('Weapon', 'Armor', 'Bracelet', 'Locket', 'Ring', 'Book', 'Spirit')
    and workbook_rows.row_number > 2
    and (
      workbook_rows.cell_values ? 'H'
      or workbook_rows.cell_values ? 'B'
      or workbook_rows.cell_values ? 'I'
    )
)
insert into glyph_source_rows (
  source_record_id, equipment_category, source_row_number, rarity_label, glyph_name, cell_values
)
select
  source_records.id,
  glyph_rows.equipment_category,
  glyph_rows.row_number,
  glyph_rows.rarity_label,
  glyph_rows.glyph_name,
  glyph_rows.cell_values
from glyph_rows
join source_records
  on source_records.catalog_source_id = glyph_rows.catalog_source_id
  and source_records.external_key =
    'workbook:Archero Glyphs.xlsx:sheet:' || glyph_rows.equipment_category || ':row:' || glyph_rows.row_number
  and source_records.entity_type = 'glyph_source_row'
on conflict (source_record_id) do update
set
  equipment_category = excluded.equipment_category,
  source_row_number = excluded.source_row_number,
  rarity_label = excluded.rarity_label,
  glyph_name = excluded.glyph_name,
  cell_values = excluded.cell_values;
