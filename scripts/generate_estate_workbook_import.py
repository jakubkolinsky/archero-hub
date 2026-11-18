#!/usr/bin/env python3
"""Stage Workers and Estate data from the Workers, Estate workbook.

- Workers: a name row in column A with star headers (0-8 stars in C-K), then
  one row per stat (label in B, values per star).
- Buildings: a name row in column A with the building stat (C) and promotion
  star headers (G-K), then promotion stat rows (label in F, values per star).
  "Upgrade materials"/"Promotion material" labels have no values (icons only).
- level ups: row 1 lists levels, one per 3-column group. Each building has a
  stat row followed by optional Production and Cost rows; a value can sit in
  any column of its level's group.
- Scroll, stone costs and the Workers shard-cost header: cost tables, keyed by
  their labels exactly as written.

Values are kept verbatim with `number` added when the cell is a bare number.

Usage: generate_estate_workbook_import.py OUTPUT.sql
"""

import hashlib
import json
import re
import sys
from pathlib import Path

from generate_workbook_provenance_import import read_workbook, sql_string

WORKBOOK_PATH = Path("/home/jakubkolinsky/Downloads/Archero Workers, Estate.xlsx")


def col_index(column: str) -> int:
    index = 0
    for char in column:
        index = index * 26 + ord(char) - 64
    return index


def value(raw: str) -> dict:
    raw = raw.strip()
    entry: dict = {"raw": raw}
    if re.fullmatch(r"-?\d+(\.\d+)?", raw):
        entry["number"] = float(raw)
    return entry


def keyed(header: dict[str, str], cells: dict[str, str], columns: str) -> dict[str, dict]:
    return {header[c]: value(cells[c]) for c in columns if c in cells and c in header}


def parse_workers(rows):
    workers, costs = [], []
    header_rows = [r for r, c in rows if "A" in c]
    by_row = dict(rows)
    star_header = by_row[1]
    costs.append((1, "Workers", by_row[1]["A"], keyed(star_header, by_row[2], "CDEFGHIJK")))
    for start, end in zip(header_rows[1:], header_rows[2:] + [max(by_row) + 1]):
        head = by_row[start]
        stats = []
        for row in range(start + 1, end):
            cells = by_row.get(row)
            if not cells:
                continue
            if "B" not in cells:
                raise SystemExit(f"Worker row {row} has values without a stat label")
            stats.append({"stat": " ".join(cells["B"].split()), "values": keyed(head, cells, "CDEFGHIJK")})
        workers.append((start, end - 1, head["A"].strip(), stats))
    return workers, costs


def parse_buildings(rows):
    buildings = []
    by_row = dict(rows)
    starts = [r for r, c in rows if "A" in c]
    for start, end in zip(starts, starts[1:] + [max(by_row) + 1]):
        head = by_row[start]
        promotions = []
        for row in range(start + 1, end):
            cells = by_row.get(row, {})
            if "F" in cells:
                promotions.append({"stat": " ".join(cells["F"].split()), "values": keyed(head, cells, "GHIJK")})
        buildings.append((start, end - 1, head["A"].strip(), head.get("C", "").strip(), promotions))
    return buildings


def parse_levels(rows):
    by_row = dict(rows)
    level_columns = {col_index(c): int(float(v)) for c, v in by_row[1].items() if c not in ("A", "B")}
    group_of = {}
    for start, level in level_columns.items():
        for offset in range(3):
            group_of[start + offset] = level

    def by_level(cells: dict[str, str], row: int) -> dict[str, dict]:
        out: dict[str, dict] = {}
        for column, raw in cells.items():
            if column in ("A", "B"):
                continue
            level = group_of.get(col_index(column))
            if level is None:
                raise SystemExit(f"level ups row {row} column {column} is outside any level group")
            if str(level) in out:
                raise SystemExit(f"level ups row {row} has two values for level {level}")
            out[str(level)] = value(raw)
        return out

    levels = []
    building_rows = [r for r, c in rows if r > 1 and c.get("A") and c.get("B")]
    note_rows = [r for r, c in rows if r > 1 and c.get("A") and not c.get("B")]
    for start in building_rows:
        cells = by_row[start]
        entry = {"stat": cells["B"].strip(), "stat_values": by_level(cells, start), "production": {}, "cost": {}}
        row = start + 1
        while row in by_row and not by_row[row].get("A") and by_row[row].get("B") in ("Production", "Cost"):
            entry[by_row[row]["B"].lower()] = by_level(by_row[row], row)
            row += 1
        levels.append((start, row - 1, cells["A"].strip(), entry))
    notes = [" ".join(by_row[r]["A"].split()) for r in note_rows]
    return levels, notes


def parse_cost_tables(rows):
    tables = []
    by_row = dict(rows)
    for row, cells in rows:
        if "A" in cells and row + 1 in by_row:
            header = {c: v for c, v in cells.items() if c != "A"}
            header = {c: (str(int(float(v))) if re.fullmatch(r"\d+\.0", v) else v) for c, v in header.items()}
            tables.append((row, "Scroll, stone costs", cells["A"].strip(), keyed(header, by_row[row + 1], "DEFGHIJKLM")))
    return tables


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate_estate_workbook_import.py OUTPUT.sql")
    sheets = dict(read_workbook(WORKBOOK_PATH))
    fingerprint = hashlib.sha256(WORKBOOK_PATH.read_bytes()).hexdigest()
    workers, worker_costs = parse_workers(sheets["Workers"])
    buildings = parse_buildings(sheets["Buildings"])
    levels, level_notes = parse_levels(sheets["level ups"])
    costs = worker_costs + parse_cost_tables(sheets["Scroll, stone costs"])

    def key(sheet: str, row: int) -> str:
        return f"workbook:{WORKBOOK_PATH.name}:sheet:{sheet}:row:{row}"

    def j(data) -> str:
        return sql_string(json.dumps(data, ensure_ascii=True)) + "::jsonb"

    records = (
        [(key("Workers", s), "estate_source_worker", f"{fingerprint}:sheet:Workers:rows:{s}-{e}") for s, e, _, _ in workers]
        + [(key("Buildings", s), "estate_source_building", f"{fingerprint}:sheet:Buildings:rows:{s}-{e}") for s, e, *_ in buildings]
        + [(key("level ups", s), "estate_source_building_levels", f"{fingerprint}:sheet:level ups:rows:{s}-{e}") for s, e, _, _ in levels]
        + [(key(sheet, r), "estate_source_cost_table", f"{fingerprint}:sheet:{sheet}:row:{r}") for r, sheet, _, _ in costs]
    )
    record_values = ",\n".join(f"    ({sql_string(k)}, {sql_string(t)}, {sql_string(f)})" for k, t, f in records)
    worker_values = ",\n".join(
        f"    ({sql_string(key('Workers', s))}, {s}, {e}, {sql_string(n)}, {j(stats)})" for s, e, n, stats in workers
    )
    building_values = ",\n".join(
        f"    ({sql_string(key('Buildings', s))}, {s}, {e}, {sql_string(n)}, {sql_string(stat)}, {j(promo)})"
        for s, e, n, stat, promo in buildings
    )
    level_values = ",\n".join(
        f"    ({sql_string(key('level ups', s))}, {s}, {e}, {sql_string(n)}, {sql_string(entry['stat'])}, "
        f"{j(entry['stat_values'])}, {j(entry['production'])}, {j(entry['cost'])})"
        for s, e, n, entry in levels
    )
    cost_values = ",\n".join(
        f"    ({sql_string(key(sheet, r))}, {sql_string(sheet)}, {r}, {sql_string(label)}, {j(vals)})"
        for r, sheet, label, vals in costs
    )

    def insert(table: str, entity: str, columns: list[str], typed_values: str, conflict_updates: list[str]) -> str:
        cols = ", ".join(columns)
        return f"""with parsed (external_key, {cols}) as (
  values
{typed_values}
)
insert into {table} (source_record_id, {cols})
select source_records.id, {", ".join("parsed." + c for c in columns)}
from parsed
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = parsed.external_key
  and source_records.entity_type = '{entity}'
on conflict (source_record_id) do update
set {", ".join(f"{c} = excluded.{c}" for c in conflict_updates)};
"""

    rls = "\n".join(
        f"""alter table {t} enable row level security;
create policy "Admins can manage {t.replace('_', ' ')}" on {t}
for all to authenticated using (is_admin()) with check (is_admin());
"""
        for t in ["estate_source_workers", "estate_source_buildings", "estate_source_building_levels", "estate_source_cost_tables"]
    )

    Path(sys.argv[1]).write_text(
        f"""-- Generated by scripts/generate_estate_workbook_import.py from {WORKBOOK_PATH.name}
-- sha256 {fingerprint}. {len(workers)} workers, {len(buildings)} buildings,
-- {len(levels)} building level tracks, {len(costs)} cost tables. Everything stays unreviewed.
-- Workbook note: {level_notes[0] if level_notes else ''}
create table estate_source_workers (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  source_row_start integer not null check (source_row_start > 0),
  source_row_end integer not null check (source_row_end >= source_row_start),
  worker_name text not null,
  star_stats jsonb not null default '[]'::jsonb
);

create table estate_source_buildings (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  source_row_start integer not null check (source_row_start > 0),
  source_row_end integer not null check (source_row_end >= source_row_start),
  building_name text not null,
  building_stat text not null,
  promotion_stats jsonb not null default '[]'::jsonb
);

create table estate_source_building_levels (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  source_row_start integer not null check (source_row_start > 0),
  source_row_end integer not null check (source_row_end >= source_row_start),
  building_name text not null,
  stat_name text not null,
  stat_by_level jsonb not null default '{{}}'::jsonb,
  production_by_level jsonb not null default '{{}}'::jsonb,
  cost_by_level jsonb not null default '{{}}'::jsonb
);

create table estate_source_cost_tables (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  sheet_name text not null,
  source_row integer not null check (source_row > 0),
  label text not null,
  cost_values jsonb not null
);

{rls}
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

{insert("estate_source_workers", "estate_source_worker", ["source_row_start", "source_row_end", "worker_name", "star_stats"], worker_values, ["source_row_start", "source_row_end", "worker_name", "star_stats"])}
{insert("estate_source_buildings", "estate_source_building", ["source_row_start", "source_row_end", "building_name", "building_stat", "promotion_stats"], building_values, ["source_row_start", "source_row_end", "building_name", "building_stat", "promotion_stats"])}
{insert("estate_source_building_levels", "estate_source_building_levels", ["source_row_start", "source_row_end", "building_name", "stat_name", "stat_by_level", "production_by_level", "cost_by_level"], level_values, ["source_row_start", "source_row_end", "building_name", "stat_name", "stat_by_level", "production_by_level", "cost_by_level"])}
{insert("estate_source_cost_tables", "estate_source_cost_table", ["sheet_name", "source_row", "label", "cost_values"], cost_values, ["sheet_name", "source_row", "label", "cost_values"])}"""
    )
    print(f"{len(workers)} workers, {len(buildings)} buildings, {len(levels)} level tracks, {len(costs)} cost tables")


if __name__ == "__main__":
    main()
