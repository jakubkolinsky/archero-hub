#!/usr/bin/env python3
"""Stage Hatchery monster data from the Hatchery 4.8.4 workbook (Feb 2022).

One record per monster, merged from three sheets by monster name:
- Data (rows 4+): version, boss flag, hatch, NH timer, quests, kill cap, keyed
  by the header labels in row 3.
- Zones per Monster: recommended zones (D-M) and available zones (N+).
- Monster Training: star bonuses (C-E), one training stat with per-star values
  over three star series (G-Q, R-V, W-AA; row 2 headers, row 3 total eggs
  hatched), training costs, and Support unlocks. Columns past AA are a
  calculator panel and are ignored.

Summary Table, WhereToGo, Bosses, and Monster Type are views or lists derived
from the same data and stay raw-only.

Usage: generate_hatchery_import.py OUTPUT.sql
"""

import hashlib
import json
import re
import sys
from pathlib import Path

from generate_workbook_provenance_import import read_workbook, sql_string

WORKBOOK_PATH = Path(
    "/home/jakubkolinsky/Downloads/Archero Hatchery 4.8.4 (LanderZ, mrb, Shusaku, Abstrusity, LuhCaran).xlsx"
)
LAST_TRAINING_COLUMN = "AA"
# Training sheet spellings that differ from the Data sheet.
NAME_ALIASES = {"Medusa - Boss": "Medusa-Boss"}


def col_index(column: str) -> int:
    index = 0
    for char in column:
        index = index * 26 + ord(char) - 64
    return index


def series_of(column: str) -> int:
    index = col_index(column)
    return 1 if index <= col_index("Q") else 2 if index <= col_index("V") else 3


def value(raw: str) -> dict:
    raw = raw.strip()
    entry: dict = {"raw": raw}
    match = re.fullmatch(r"(-?\d+(?:\.\d+)?)(k?)", raw)
    if match:
        entry["number"] = float(match.group(1)) * (1000 if match.group(2) else 1)
    return entry


def parse_data(rows):
    header = dict(rows)[3]
    labels = {c: header[c] for c in "ACDEFGHI"}
    monsters = {}
    for row, cells in rows:
        if row <= 3 or not cells.get("B"):
            continue
        name = cells["B"].strip()
        monsters[name] = (row, {labels[c]: value(cells[c]) for c in labels if c in cells})
    return monsters


def parse_zones(rows):
    zones = {}
    for row, cells in rows:
        if row == 1:
            continue
        ordered = sorted(cells.items(), key=lambda item: col_index(item[0]))
        zones[cells["B"].strip()] = (
            row,
            {
                "zone_count": value(cells.get("C", "")),
                "recommended": [v for c, v in ordered if col_index("D") <= col_index(c) <= col_index("M")],
                "available": [v for c, v in ordered if col_index(c) >= col_index("N")],
            },
        )
    return zones


def parse_training(rows):
    by_row = dict(rows)
    star_header, egg_header = by_row[2], by_row[3]
    training_columns = [
        c for c in star_header if col_index("G") <= col_index(c) <= col_index(LAST_TRAINING_COLUMN)
    ]
    starts = [r for r, c in rows if r > 3 and c.get("B")]
    training = {}
    for start, end in zip(starts, starts[1:] + [max(by_row) + 1]):
        name = by_row[start]["B"].strip()
        name = NAME_ALIASES.get(name, name)
        star_bonuses, stats, costs, supports = [], [], {}, []
        for row in range(start, end):
            cells = by_row.get(row, {})
            if cells.get("C"):
                bonus = {"star": cells["C"], "effect": cells.get("D", "")}
                if cells.get("E"):
                    bonus["value"] = value(cells["E"])
                star_bonuses.append(bonus)
            label = cells.get("F")
            in_range = {c: v for c, v in cells.items() if c in training_columns}
            if label == "Cost":
                costs = {c: value(v) for c, v in in_range.items()}
            elif label == "Support +":
                supports.append(
                    {
                        "unlock": in_range.get("G", ""),
                        "effects": [
                            {"column": c, "star": star_header[c], "series": series_of(c), "effect": v}
                            for c, v in in_range.items()
                            if c != "G"
                        ],
                    }
                )
            elif label or in_range:
                # Extra stats carry an unlock note such as "(5★ Can Unlock)" in column G.
                note = in_range.get("G", "") if not re.fullmatch(r"[\d.]+k?", in_range.get("G", "0")) else ""
                stats.append(
                    {
                        "stat": label or "",
                        "unlock": note,
                        "values": {c: value(v) for c, v in in_range.items() if not (c == "G" and note)},
                    }
                )
        if not stats:
            raise SystemExit(f"Training block {name} at row {start} has no training stat")
        columns = [
            {
                "column": c,
                "series": series_of(c),
                "star": star_header[c],
                "eggs_hatched": value(egg_header[c]) if c in egg_header else None,
            }
            for c in training_columns
        ]
        training[name] = (
            start,
            {
                "stat_bonuses": star_bonuses,
                "training_stats": stats,
                "training_costs": costs,
                "star_columns": columns,
                "supports": supports,
            },
        )
    return training


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate_hatchery_import.py OUTPUT.sql")
    sheets = dict(read_workbook(WORKBOOK_PATH))
    fingerprint = hashlib.sha256(WORKBOOK_PATH.read_bytes()).hexdigest()
    data = parse_data(sheets["Data"])
    zones = parse_zones(sheets["Zones per Monster"])
    training = parse_training(sheets["Monster Training"])

    names = sorted(set(data) | set(zones) | set(training))
    gaps = {
        name: [s for s, source in (("Data", data), ("Zones", zones), ("Training", training)) if name not in source]
        for name in names
    }
    gaps = {name: missing for name, missing in gaps.items() if missing}
    for name, missing in gaps.items():
        print(f"note: {name} missing from {', '.join(missing)}")

    def key(name: str) -> str:
        return f"workbook:{WORKBOOK_PATH.name}:monster:{name}"

    def j(payload) -> str:
        return sql_string(json.dumps(payload, ensure_ascii=True)) + "::jsonb"

    def row_or_null(source, name) -> str:
        return str(source[name][0]) if name in source else "null"

    record_values = ",\n".join(
        f"    ({sql_string(key(n))}, 'hatchery_source_monster', "
        f"{sql_string(f'{fingerprint}:monster:{n}:data:{row_or_null(data, n)}:zones:{row_or_null(zones, n)}:training:{row_or_null(training, n)}')})"
        for n in names
    )
    monster_values = ",\n".join(
        f"    ({sql_string(key(n))}, {sql_string(n)}, "
        f"{row_or_null(data, n)}, {row_or_null(zones, n)}, {row_or_null(training, n)}, "
        f"{j(data[n][1] if n in data else {})}, {j(zones[n][1] if n in zones else {})}, "
        f"{j(training[n][1] if n in training else {})})"
        for n in names
    )

    Path(sys.argv[1]).write_text(
        f"""-- Generated by scripts/generate_hatchery_import.py from {WORKBOOK_PATH.name}
-- sha256 {fingerprint}. {len(names)} monsters ({len(data)} Data, {len(zones)} Zones, {len(training)} Training).
-- Workbook last updated February 2022 (game 4.8.4); treat as historical. Everything stays unreviewed.
create table hatchery_source_monsters (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  monster_name text not null unique,
  data_source_row integer,
  zones_source_row integer,
  training_source_row integer,
  monster_data jsonb not null default '{{}}'::jsonb,
  zones jsonb not null default '{{}}'::jsonb,
  training jsonb not null default '{{}}'::jsonb
);

alter table hatchery_source_monsters enable row level security;

create policy "Admins can manage hatchery source monsters" on hatchery_source_monsters
for all to authenticated using (is_admin()) with check (is_admin());

with source_rows (external_key, entity_type, source_fingerprint) as (
  values
{record_values}
)
insert into source_records (catalog_source_id, external_key, entity_type, source_fingerprint)
select catalog_sources.id, source_rows.external_key, source_rows.entity_type, source_rows.source_fingerprint
from source_rows
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
on conflict (catalog_source_id, external_key, entity_type) do update
set source_fingerprint = excluded.source_fingerprint;

with parsed (
  external_key, monster_name, data_source_row, zones_source_row, training_source_row, monster_data, zones, training
) as (
  values
{monster_values}
)
insert into hatchery_source_monsters (
  source_record_id, monster_name, data_source_row, zones_source_row, training_source_row, monster_data, zones, training
)
select
  source_records.id, parsed.monster_name, parsed.data_source_row::integer, parsed.zones_source_row::integer,
  parsed.training_source_row::integer, parsed.monster_data, parsed.zones, parsed.training
from parsed
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = parsed.external_key
  and source_records.entity_type = 'hatchery_source_monster'
on conflict (source_record_id) do update
set
  monster_name = excluded.monster_name,
  data_source_row = excluded.data_source_row,
  zones_source_row = excluded.zones_source_row,
  training_source_row = excluded.training_source_row,
  monster_data = excluded.monster_data,
  zones = excluded.zones,
  training = excluded.training;
"""
    )
    print(f"{len(names)} monsters, {len(gaps)} with gaps")


if __name__ == "__main__":
    main()
