-- Curator review workflow for imported source records.
-- Adds review notes and reviewer stamps, and an admin-only review view that
-- shows the staged content behind each source record.

alter table source_records
  add column review_note text,
  add column reviewed_by uuid references auth.users(id) on delete set null;

-- Review metadata is set by the database, never trusted from the client.
create or replace function stamp_source_record_review()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.review_status is distinct from old.review_status then
    if new.review_status = 'unreviewed' then
      new.reviewed_at := null;
      new.reviewed_by := null;
    else
      new.reviewed_at := now();
      new.reviewed_by := auth.uid();
    end if;
  else
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
  end if;
  return new;
end;
$$;

create trigger source_records_stamp_review
before update on source_records
for each row execute function stamp_source_record_review();

create index source_records_review_idx on source_records (entity_type, review_status);

-- Staged content per source record, as JSON rows. security_invoker keeps the
-- underlying admin-only RLS in force for whoever queries the view.
create view source_review_entries
with (security_invoker = true)
as
select
  source_records.id,
  source_records.entity_type,
  source_records.external_key,
  source_records.review_status,
  source_records.review_note,
  source_records.reviewed_at,
  source_records.created_at,
  catalog_sources.name as source_name,
  coalesce(details.rows, '[]'::jsonb) as details,
  -- Key plus content as text, so curators can search by names inside the data.
  source_records.external_key || ' ' || coalesce(details.rows::text, '') as search_text
from source_records
join catalog_sources on catalog_sources.id = source_records.catalog_source_id
left join lateral (
  select jsonb_agg(staged.row_data) as rows
  from (
    select to_jsonb(t) - 'id' - 'source_record_id' as row_data from skin_source_entries t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from jewel_source_effects t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from medal_source_entries t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from relic_source_entries t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from hero_assist_source_effects t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' - 'created_at' from hero_bonus_milestones t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from pet_source_profiles t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from pet_source_skills t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from dragon_statue_source_stats t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from dragon_statue_source_metadata t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from dragon_statue_source_costs t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from glyph_source_rows t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from sigil_source_rows t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from outfit_source_entries t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from quick_raid_source_chapters t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from estate_source_workers t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from estate_source_buildings t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from estate_source_building_levels t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from estate_source_cost_tables t where t.source_record_id = source_records.id
    union all select to_jsonb(t) - 'id' - 'source_record_id' from hatchery_source_monsters t where t.source_record_id = source_records.id
    union all
    select jsonb_build_object(
      'workbook', workbook_imports.filename,
      'sheet', workbook_sheets.name,
      'row_count', workbook_sheets.row_count,
      'header_values', workbook_sheets.header_values
    )
    from workbook_sheets
    join workbook_imports on workbook_imports.id = workbook_sheets.workbook_import_id
    where source_records.entity_type = 'workbook_sheet'
      and source_records.external_key = 'workbook:' || workbook_imports.filename || ':sheet:' || workbook_sheets.name
  ) staged
) details on true;

create view source_review_summary
with (security_invoker = true)
as
select entity_type, review_status, count(*)::integer as record_count
from source_records
group by entity_type, review_status;

revoke all on source_review_entries from anon;
revoke all on source_review_summary from anon;
grant select on source_review_entries to authenticated;
grant select on source_review_summary to authenticated;
