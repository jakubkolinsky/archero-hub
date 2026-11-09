#!/usr/bin/env python3
"""Generate a migration for the clean, structured workbook sources."""

import hashlib
import json
import sys
from pathlib import Path

from generate_workbook_provenance_import import read_workbook

WORKBOOK_DIRECTORY = Path("/home/jakubkolinsky/Downloads")


def sql_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_values(rows: list[tuple[str, ...]]) -> str:
    return ",\n".join(
        "    (" + ", ".join(sql_string(value) for value in row) + ")" for row in rows
    )


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate_clean_workbook_import.py OUTPUT.sql")

    def workbook(name: str) -> dict[str, list[tuple[int, dict[str, str]]]]:
        return dict(read_workbook(WORKBOOK_DIRECTORY / name))

    records: list[tuple[str, str, str]] = []
    skins: list[tuple[str, str, str, str, str, str, str, str]] = []
    jewel_effects: list[tuple[str, str, str, str, str]] = []
    medals: list[tuple[str, str, str, str, str, str]] = []
    relics: list[tuple[str, str, str, str, str, str, str]] = []
    assists: list[tuple[str, str, str, str, str, str]] = []

    skin_filename = "Archero.xlsx"
    skin_fingerprint = hashlib.sha256(
        (WORKBOOK_DIRECTORY / skin_filename).read_bytes()
    ).hexdigest()
    skin_sheets = workbook(skin_filename)
    for sheet_name, subject_type in (
        ("Weapon Skin Bonuses", "weapon"),
        ("Hero Skin Bonuses", "hero"),
    ):
        bonus_scope = ""
        for row_number, cells in skin_sheets[sheet_name]:
            if len(cells) == 1 and "A" in cells and cells["A"].endswith("hero skins"):
                bonus_scope = cells["A"]
                continue
            if not all(column in cells for column in ("A", "B", "C", "D", "F")):
                continue
            if cells["A"] == "Skin":
                continue
            key = f"workbook:{skin_filename}:sheet:{sheet_name}:row:{row_number}"
            records.append((key, "skin_source_row", f"{skin_fingerprint}:row:{row_number}"))
            skins.append(
                (
                    key,
                    subject_type,
                    bonus_scope,
                    cells["A"],
                    cells["B"],
                    cells["C"],
                    cells["D"],
                    cells["F"],
                )
            )

    jewel_filename = "Archero Jewels.xlsx"
    jewel_fingerprint = hashlib.sha256(
        (WORKBOOK_DIRECTORY / jewel_filename).read_bytes()
    ).hexdigest()
    jewel_rows = workbook(jewel_filename)["Jewels"]
    levels = next(cells for row_number, cells in jewel_rows if row_number == 1)
    current_jewel = ""
    for row_number, cells in jewel_rows:
        if row_number == 1:
            continue
        if set(cells) == {"A"}:
            current_jewel = cells["A"]
            continue
        if not current_jewel or "A" not in cells:
            continue
        key = f"workbook:{jewel_filename}:sheet:Jewels:row:{row_number}"
        records.append((key, "jewel_source_row", f"{jewel_fingerprint}:row:{row_number}"))
        for column, level in levels.items():
            if column != "A" and column in cells:
                jewel_effects.append(
                    (key, current_jewel, cells["A"], level, cells[column])
                )

    medal_filename = "Archero Medals.xlsx"
    medal_fingerprint = hashlib.sha256(
        (WORKBOOK_DIRECTORY / medal_filename).read_bytes()
    ).hexdigest()
    for row_number, cells in workbook(medal_filename)["Archero Medals"]:
        if not all(column in cells for column in ("B", "C", "D", "E")):
            continue
        key = f"workbook:{medal_filename}:sheet:Archero Medals:row:{row_number}"
        records.append((key, "medal_source_row", f"{medal_fingerprint}:row:{row_number}"))
        medals.append((key, cells["B"], cells["C"], cells["D"], cells["E"], ""))

    relic_filename = "Archero Relics.xlsx"
    relic_fingerprint = hashlib.sha256(
        (WORKBOOK_DIRECTORY / relic_filename).read_bytes()
    ).hexdigest()
    current_relic = ""
    for row_number, cells in workbook(relic_filename)["Stats"]:
        if cells.get("B"):
            current_relic = cells["B"]
        if not current_relic or cells.get("C") == "Base Effect":
            continue
        if not any(column in cells for column in ("C", "E", "U")):
            continue
        key = f"workbook:{relic_filename}:sheet:Stats:row:{row_number}"
        records.append((key, "relic_source_row", f"{relic_fingerprint}:row:{row_number}"))
        advanced_values = {
            column: value
            for column, value in cells.items()
            if "F" <= column <= "T"
        }
        relics.append(
            (
                key,
                current_relic,
                cells.get("C", ""),
                cells.get("D", ""),
                cells.get("E", ""),
                json.dumps(advanced_values, ensure_ascii=True),
                cells.get("U", ""),
            )
        )

    assist_filename = "Assist Brave Hero List (LuhCaran, Sloth, Kyle, Chaos).xlsx"
    assist_fingerprint = hashlib.sha256(
        (WORKBOOK_DIRECTORY / assist_filename).read_bytes()
    ).hexdigest()
    assist_rows = workbook(assist_filename)["Assist Brave Hero list"]
    stages = next(cells for row_number, cells in assist_rows if row_number == 2)
    for row_number, cells in assist_rows:
        if row_number < 3 or "A" not in cells:
            continue
        key = f"workbook:{assist_filename}:sheet:Assist Brave Hero list:row:{row_number}"
        records.append((key, "hero_assist_source_row", f"{assist_fingerprint}:row:{row_number}"))
        for column, stage in stages.items():
            if "B" <= column <= "L" and column in cells:
                assists.append(
                    (
                        key,
                        cells["A"],
                        column,
                        stage,
                        cells[column],
                        cells.get("M", ""),
                    )
                )

    unique_records = list(dict.fromkeys(records))
    output_path = Path(sys.argv[1])
    output_path.write_text(
        """create table skin_source_entries (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  subject_type text not null check (subject_type in ('weapon', 'hero')),
  bonus_scope text not null,
  skin_name text not null,
  subject_name text not null,
  shared_bonus text not null,
  price_description text not null,
  effect text not null
);

create table jewel_source_effects (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null references source_records(id) on delete restrict,
  jewel_name text not null,
  effect_name text not null,
  jewel_level text not null,
  effect_value text not null,
  unique (source_record_id, jewel_level)
);

create table medal_source_entries (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  medal_name text not null,
  trigger_description text not null,
  rarity text not null,
  enhancement text not null,
  image_reference text not null
);

create table relic_source_entries (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  relic_name text not null,
  base_effect_name text not null,
  base_effect_value text not null,
  advanced_effect_name text not null,
  advanced_values jsonb not null default '{}'::jsonb,
  exclusive_effect text not null
);

create table hero_assist_source_effects (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null references source_records(id) on delete restrict,
  hero_name text not null,
  stage_column text not null,
  stage text not null,
  effect text not null,
  stone_type text not null,
  unique (source_record_id, stage_column)
);

alter table skin_source_entries enable row level security;
alter table jewel_source_effects enable row level security;
alter table medal_source_entries enable row level security;
alter table relic_source_entries enable row level security;
alter table hero_assist_source_effects enable row level security;

create policy "Admins can manage skin source entries" on skin_source_entries
for all to authenticated using (is_admin()) with check (is_admin());

create policy "Admins can manage jewel source effects" on jewel_source_effects
for all to authenticated using (is_admin()) with check (is_admin());

create policy "Admins can manage medal source entries" on medal_source_entries
for all to authenticated using (is_admin()) with check (is_admin());

create policy "Admins can manage relic source entries" on relic_source_entries
for all to authenticated using (is_admin()) with check (is_admin());

create policy "Admins can manage hero assist source effects" on hero_assist_source_effects
for all to authenticated using (is_admin()) with check (is_admin());

with source_rows (external_key, entity_type, source_fingerprint) as (
  values
"""
        + sql_values(unique_records)
        + """
)
insert into source_records (catalog_source_id, external_key, entity_type, source_fingerprint)
select
  catalog_sources.id,
  source_rows.external_key,
  source_rows.entity_type,
  source_rows.source_fingerprint
from source_rows
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
on conflict (catalog_source_id, external_key, entity_type) do update
set source_fingerprint = excluded.source_fingerprint;
"""
        + """
with entries (
  external_key, subject_type, bonus_scope, skin_name, subject_name, shared_bonus, price_description, effect
) as (
  values
"""
        + sql_values(skins)
        + """
)
insert into skin_source_entries (
  source_record_id, subject_type, bonus_scope, skin_name, subject_name, shared_bonus, price_description, effect
)
select
  source_records.id,
  entries.subject_type,
  entries.bonus_scope,
  entries.skin_name,
  entries.subject_name,
  entries.shared_bonus,
  entries.price_description,
  entries.effect
from entries
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = entries.external_key
  and source_records.entity_type = 'skin_source_row'
on conflict (source_record_id) do update
set
  subject_type = excluded.subject_type,
  bonus_scope = excluded.bonus_scope,
  skin_name = excluded.skin_name,
  subject_name = excluded.subject_name,
  shared_bonus = excluded.shared_bonus,
  price_description = excluded.price_description,
  effect = excluded.effect;
"""
        + """
with effects (external_key, jewel_name, effect_name, jewel_level, effect_value) as (
  values
"""
        + sql_values(jewel_effects)
        + """
)
insert into jewel_source_effects (
  source_record_id, jewel_name, effect_name, jewel_level, effect_value
)
select source_records.id, effects.jewel_name, effects.effect_name, effects.jewel_level, effects.effect_value
from effects
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = effects.external_key
  and source_records.entity_type = 'jewel_source_row'
on conflict (source_record_id, jewel_level) do update
set
  jewel_name = excluded.jewel_name,
  effect_name = excluded.effect_name,
  effect_value = excluded.effect_value;
"""
        + """
with entries (external_key, medal_name, trigger_description, rarity, enhancement, image_reference) as (
  values
"""
        + sql_values(medals)
        + """
)
insert into medal_source_entries (
  source_record_id, medal_name, trigger_description, rarity, enhancement, image_reference
)
select
  source_records.id,
  entries.medal_name,
  entries.trigger_description,
  entries.rarity,
  entries.enhancement,
  entries.image_reference
from entries
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = entries.external_key
  and source_records.entity_type = 'medal_source_row'
on conflict (source_record_id) do update
set
  medal_name = excluded.medal_name,
  trigger_description = excluded.trigger_description,
  rarity = excluded.rarity,
  enhancement = excluded.enhancement,
  image_reference = excluded.image_reference;
"""
        + """
with entries (
  external_key, relic_name, base_effect_name, base_effect_value, advanced_effect_name, advanced_values, exclusive_effect
) as (
  values
"""
        + ",\n".join(
            f"    ({sql_string(key)}, {sql_string(name)}, {sql_string(base_name)}, "
            f"{sql_string(base_value)}, {sql_string(advanced_name)}, "
            f"{sql_string(advanced_values)}::jsonb, {sql_string(exclusive_effect)})"
            for key, name, base_name, base_value, advanced_name, advanced_values, exclusive_effect in relics
        )
        + """
)
insert into relic_source_entries (
  source_record_id, relic_name, base_effect_name, base_effect_value, advanced_effect_name, advanced_values, exclusive_effect
)
select
  source_records.id,
  entries.relic_name,
  entries.base_effect_name,
  entries.base_effect_value,
  entries.advanced_effect_name,
  entries.advanced_values,
  entries.exclusive_effect
from entries
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = entries.external_key
  and source_records.entity_type = 'relic_source_row'
on conflict (source_record_id) do update
set
  relic_name = excluded.relic_name,
  base_effect_name = excluded.base_effect_name,
  base_effect_value = excluded.base_effect_value,
  advanced_effect_name = excluded.advanced_effect_name,
  advanced_values = excluded.advanced_values,
  exclusive_effect = excluded.exclusive_effect;
"""
        + """
with effects (external_key, hero_name, stage_column, stage, effect, stone_type) as (
  values
"""
        + sql_values(assists)
        + """
)
insert into hero_assist_source_effects (
  source_record_id, hero_name, stage_column, stage, effect, stone_type
)
select
  source_records.id,
  effects.hero_name,
  effects.stage_column,
  effects.stage,
  effects.effect,
  effects.stone_type
from effects
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = effects.external_key
  and source_records.entity_type = 'hero_assist_source_row'
on conflict (source_record_id, stage_column) do update
set
  hero_name = excluded.hero_name,
  stage = excluded.stage,
  effect = excluded.effect,
  stone_type = excluded.stone_type;
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
