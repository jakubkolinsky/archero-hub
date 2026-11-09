#!/usr/bin/env python3
"""Generate a migration that stages source-backed Pet workbook records."""

import hashlib
import json
import sys
from pathlib import Path

from generate_workbook_provenance_import import read_workbook

WORKBOOK_PATH = Path("/home/jakubkolinsky/Downloads/Archero Pets.xlsx")
PET_NAMES = {
    "Polar Penguin King",
    "Empyrean Unicorn",
    "Verdafrost Bear",
    "Frothy Capy",
    "Furious Blitzbeak",
    "Ignitus Bird",
    "Fiery Frog",
    "Nightstar Cat",
    "Thunderworm",
    "Amethyne Turtle",
    "Spirit Butterfly",
}
SECTION_HEADERS = {"Battle Skills", "Kindred Skill", "Talent Skill"}


def sql_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def values(rows: list[tuple[str, ...]]) -> str:
    return ",\n".join(
        "    (" + ", ".join(sql_string(value) for value in row) + ")" for row in rows
    )


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate_pet_workbook_import.py OUTPUT.sql")

    rows = dict(read_workbook(WORKBOOK_PATH))["Pets"]
    fingerprint = hashlib.sha256(WORKBOOK_PATH.read_bytes()).hexdigest()
    pet_starts = [index for index, (_, cells) in enumerate(rows) if cells.get("B") in PET_NAMES]

    profiles: list[tuple[str, str, str, str, str, str, str]] = []
    skills: list[tuple[str, str, str, str, str, str, str, str]] = []
    source_records: list[tuple[str, str, str]] = []

    for position, start_index in enumerate(pet_starts):
        end_index = (
            pet_starts[position + 1] if position + 1 < len(pet_starts) else len(rows)
        )
        pet_rows = rows[start_index:end_index]
        pet_name = pet_rows[0][1]["B"]
        first_section_index = next(
            index
            for index, (_, cells) in enumerate(pet_rows)
            if cells.get("B") in SECTION_HEADERS
        )
        profile_rows = pet_rows[:first_section_index]
        profile_start = profile_rows[0][0]
        profile_end = profile_rows[-1][0]
        profile_key = (
            f"workbook:Archero Pets.xlsx:sheet:Pets:profile:{pet_name}:{profile_start}-{profile_end}"
        )
        base_stats = {
            cells["C"]: cells["D"]
            for _, cells in profile_rows
            if "C" in cells and "D" in cells
        }
        level_effects = [
            {"level": cells["E"], "effect": cells["F"]}
            for _, cells in profile_rows
            if "E" in cells and "F" in cells
        ]
        unlocks = [
            {"row": row_number, "effect": cells["J"]}
            for row_number, cells in profile_rows
            if "J" in cells
        ]
        source_records.append(
            (
                profile_key,
                "pet_source_profile",
                f"{fingerprint}:rows:{profile_start}-{profile_end}",
            )
        )
        profiles.append(
            (
                profile_key,
                pet_name,
                str(profile_start),
                str(profile_end),
                json.dumps(base_stats, ensure_ascii=True),
                json.dumps(level_effects, ensure_ascii=True),
                json.dumps(unlocks, ensure_ascii=True),
            )
        )

        section = ""
        skill_start_index = None
        for index in range(first_section_index, len(pet_rows) + 1):
            if index < len(pet_rows):
                row_number, cells = pet_rows[index]
                label = cells.get("B")
            else:
                row_number, cells, label = 0, {}, "__end__"

            if label in SECTION_HEADERS:
                if skill_start_index is not None:
                    skill_rows = pet_rows[skill_start_index:index]
                    skill_start, skill_end = skill_rows[0][0], skill_rows[-1][0]
                    skill_name = skill_rows[0][1]["B"]
                    key = f"workbook:Archero Pets.xlsx:sheet:Pets:skill:{pet_name}:{skill_start}"
                    source_records.append(
                        (key, "pet_source_skill", f"{fingerprint}:rows:{skill_start}-{skill_end}")
                    )
                    skills.append(
                        (
                            key,
                            pet_name,
                            section,
                            skill_name,
                            "\n".join(
                                cells["A"] for _, cells in skill_rows if "A" in cells
                            ),
                            str(skill_start),
                            str(skill_end),
                            json.dumps(
                                [
                                    {"level": cells["E"], "effect": cells["F"]}
                                    for _, cells in skill_rows
                                    if "E" in cells and "F" in cells
                                ],
                                ensure_ascii=True,
                            ),
                        )
                    )
                    skill_start_index = None
                section = label
            elif label:
                if skill_start_index is not None:
                    skill_rows = pet_rows[skill_start_index:index]
                    skill_start, skill_end = skill_rows[0][0], skill_rows[-1][0]
                    skill_name = skill_rows[0][1]["B"]
                    key = f"workbook:Archero Pets.xlsx:sheet:Pets:skill:{pet_name}:{skill_start}"
                    source_records.append(
                        (key, "pet_source_skill", f"{fingerprint}:rows:{skill_start}-{skill_end}")
                    )
                    skills.append(
                        (
                            key,
                            pet_name,
                            section,
                            skill_name,
                            "\n".join(
                                cells["A"] for _, cells in skill_rows if "A" in cells
                            ),
                            str(skill_start),
                            str(skill_end),
                            json.dumps(
                                [
                                    {"level": cells["E"], "effect": cells["F"]}
                                    for _, cells in skill_rows
                                    if "E" in cells and "F" in cells
                                ],
                                ensure_ascii=True,
                            ),
                        )
                    )
                if index < len(pet_rows):
                    skill_start_index = index

    output_path = Path(sys.argv[1])
    output_path.write_text(
        """create table pet_source_profiles (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  pet_id uuid references items(id) on delete set null,
  pet_name text not null,
  source_row_start integer not null check (source_row_start > 0),
  source_row_end integer not null check (source_row_end >= source_row_start),
  base_stats jsonb not null default '{}'::jsonb,
  level_effects jsonb not null default '[]'::jsonb,
  unlocks jsonb not null default '[]'::jsonb
);

create table pet_source_skills (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  pet_id uuid references items(id) on delete set null,
  pet_name text not null,
  skill_category text not null,
  skill_name text not null,
  description text not null,
  source_row_start integer not null check (source_row_start > 0),
  source_row_end integer not null check (source_row_end >= source_row_start),
  level_effects jsonb not null default '[]'::jsonb
);

alter table pet_source_profiles enable row level security;
alter table pet_source_skills enable row level security;

create policy "Admins can manage pet source profiles" on pet_source_profiles
for all to authenticated using (is_admin()) with check (is_admin());

create policy "Admins can manage pet source skills" on pet_source_skills
for all to authenticated using (is_admin()) with check (is_admin());

with source_rows (external_key, entity_type, source_fingerprint) as (
  values
"""
        + values(source_records)
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
with profiles (
  external_key, pet_name, source_row_start, source_row_end, base_stats, level_effects, unlocks
) as (
  values
"""
        + ",\n".join(
            f"    ({sql_string(key)}, {sql_string(name)}, {start}, {end}, "
            f"{sql_string(base_stats)}::jsonb, {sql_string(level_effects)}::jsonb, "
            f"{sql_string(unlocks)}::jsonb)"
            for key, name, start, end, base_stats, level_effects, unlocks in profiles
        )
        + """
)
insert into pet_source_profiles (
  source_record_id, pet_id, pet_name, source_row_start, source_row_end, base_stats, level_effects, unlocks
)
select
  source_records.id,
  items.id,
  profiles.pet_name,
  profiles.source_row_start,
  profiles.source_row_end,
  profiles.base_stats,
  profiles.level_effects,
  profiles.unlocks
from profiles
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = profiles.external_key
  and source_records.entity_type = 'pet_source_profile'
left join items
  on lower(items.name) = lower(profiles.pet_name)
  and items.category = 'pet'
on conflict (source_record_id) do update
set
  pet_id = excluded.pet_id,
  pet_name = excluded.pet_name,
  source_row_start = excluded.source_row_start,
  source_row_end = excluded.source_row_end,
  base_stats = excluded.base_stats,
  level_effects = excluded.level_effects,
  unlocks = excluded.unlocks;
"""
        + """
with skills (
  external_key, pet_name, skill_category, skill_name, description, source_row_start, source_row_end, level_effects
) as (
  values
"""
        + ",\n".join(
            f"    ({sql_string(key)}, {sql_string(pet_name)}, {sql_string(category)}, "
            f"{sql_string(skill_name)}, {sql_string(description)}, {start}, {end}, "
            f"{sql_string(level_effects)}::jsonb)"
            for (
                key,
                pet_name,
                category,
                skill_name,
                description,
                start,
                end,
                level_effects,
            ) in skills
        )
        + """
)
insert into pet_source_skills (
  source_record_id, pet_id, pet_name, skill_category, skill_name, description, source_row_start, source_row_end, level_effects
)
select
  source_records.id,
  items.id,
  skills.pet_name,
  skills.skill_category,
  skills.skill_name,
  skills.description,
  skills.source_row_start,
  skills.source_row_end,
  skills.level_effects
from skills
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = skills.external_key
  and source_records.entity_type = 'pet_source_skill'
left join items
  on lower(items.name) = lower(skills.pet_name)
  and items.category = 'pet'
on conflict (source_record_id) do update
set
  pet_id = excluded.pet_id,
  pet_name = excluded.pet_name,
  skill_category = excluded.skill_category,
  skill_name = excluded.skill_name,
  description = excluded.description,
  source_row_start = excluded.source_row_start,
  source_row_end = excluded.source_row_end,
  level_effects = excluded.level_effects;
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
