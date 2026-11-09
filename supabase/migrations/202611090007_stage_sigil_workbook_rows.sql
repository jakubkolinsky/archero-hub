create table sigil_source_rows (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  sheet_name text not null,
  source_row_number integer not null check (source_row_number > 0),
  cell_values jsonb not null
);

alter table sigil_source_rows enable row level security;

create policy "Admins can manage sigil source rows" on sigil_source_rows
for all to authenticated using (is_admin()) with check (is_admin());

with source_rows as (
  select
    workbook_imports.catalog_source_id,
    'workbook:Archero Sigils.xlsx:sheet:' || workbook_sheets.name || ':row:' || workbook_rows.row_number as external_key,
    workbook_imports.sha256 || ':sheet:' || workbook_sheets.name || ':row:' || workbook_rows.row_number as source_fingerprint
  from workbook_imports
  join workbook_sheets on workbook_sheets.workbook_import_id = workbook_imports.id
  join workbook_rows on workbook_rows.workbook_sheet_id = workbook_sheets.id
  where workbook_imports.filename = 'Archero Sigils.xlsx'
    and workbook_sheets.name in ('Sigils', 'Faith', 'chart')
)
insert into source_records (catalog_source_id, external_key, entity_type, source_fingerprint)
select catalog_source_id, external_key, 'sigil_source_row', source_fingerprint
from source_rows
on conflict (catalog_source_id, external_key, entity_type) do update
set source_fingerprint = excluded.source_fingerprint;

with rows as (
  select
    workbook_imports.catalog_source_id,
    workbook_sheets.name as sheet_name,
    workbook_rows.row_number,
    workbook_rows.cell_values
  from workbook_imports
  join workbook_sheets on workbook_sheets.workbook_import_id = workbook_imports.id
  join workbook_rows on workbook_rows.workbook_sheet_id = workbook_sheets.id
  where workbook_imports.filename = 'Archero Sigils.xlsx'
    and workbook_sheets.name in ('Sigils', 'Faith', 'chart')
)
insert into sigil_source_rows (source_record_id, sheet_name, source_row_number, cell_values)
select source_records.id, rows.sheet_name, rows.row_number, rows.cell_values
from rows
join source_records
  on source_records.catalog_source_id = rows.catalog_source_id
  and source_records.external_key =
    'workbook:Archero Sigils.xlsx:sheet:' || rows.sheet_name || ':row:' || rows.row_number
  and source_records.entity_type = 'sigil_source_row'
on conflict (source_record_id) do update
set
  sheet_name = excluded.sheet_name,
  source_row_number = excluded.source_row_number,
  cell_values = excluded.cell_values;
