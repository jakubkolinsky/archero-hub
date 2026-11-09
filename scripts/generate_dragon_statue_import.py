#!/usr/bin/env python3
"""Generate a migration that stages Dragon Statue workbook data."""

import hashlib
import json
import sys
from pathlib import Path

from generate_workbook_provenance_import import read_workbook

WORKBOOK_PATH = Path("/home/jakubkolinsky/Downloads/Archero - Dragon Statues.xlsx")


def quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate_dragon_statue_import.py OUTPUT.sql")

    sheets = dict(read_workbook(WORKBOOK_PATH))
    fingerprint = hashlib.sha256(WORKBOOK_PATH.read_bytes()).hexdigest()
    records: list[tuple[str, str, str]] = []
    stats: list[tuple[str, str, str, str, str, str, str]] = []
    metadata: list[tuple[str, str, str, str, str]] = []
    costs: list[tuple[str, str, str, str, str, str]] = []

    for row_number, cells in sheets["Data"]:
        if not all(column in cells for column in ("A", "B", "C", "D")) or row_number == 2:
            continue
        key = f"workbook:Archero - Dragon Statues.xlsx:sheet:Data:row:{row_number}"
        records.append((key, "dragon_statue_source_stat", f"{fingerprint}:row:{row_number}"))
        stats.append(
            (
                key,
                cells["A"],
                cells["B"],
                cells["C"],
                cells["D"],
                json.dumps({key: value for key, value in cells.items() if "E" <= key <= "I"}),
                json.dumps({key: value for key, value in cells.items() if "J" <= key <= "N"}),
            )
        )

    for row_number, cells in sheets["Lookup"]:
        if not all(column in cells for column in ("A", "B", "C", "D")):
            continue
        key = f"workbook:Archero - Dragon Statues.xlsx:sheet:Lookup:row:{row_number}"
        records.append((key, "dragon_statue_source_metadata", f"{fingerprint}:row:{row_number}"))
        metadata.append((key, cells["A"], cells["B"], cells["C"], cells["D"]))

    for row_number, cells in sheets["Level up costs"]:
        if row_number == 2:
            continue
        for rank, level_column, gold_column, stones_column, total_gold_column, total_stones_column in (
            ("A", "A", "B", "C", "D", "E"),
            ("S", "G", "H", "I", "J", "K"),
            ("SS", "M", "N", "O", "P", "Q"),
        ):
            if level_column not in cells:
                continue
            key = (
                f"workbook:Archero - Dragon Statues.xlsx:sheet:Level up costs:"
                f"{rank}:row:{row_number}"
            )
            records.append((key, "dragon_statue_source_cost", f"{fingerprint}:{rank}:row:{row_number}"))
            costs.append(
                (
                    key,
                    rank,
                    cells[level_column],
                    cells.get(gold_column, ""),
                    cells.get(stones_column, ""),
                    json.dumps(
                        {
                            "gold": cells.get(total_gold_column, ""),
                            "stones": cells.get(total_stones_column, ""),
                        }
                    ),
                )
            )

    def string_values(rows: list[tuple[str, ...]]) -> str:
        return ",\n".join(
            "    (" + ", ".join(quote(value) for value in row) + ")" for row in rows
        )

    output = """create table dragon_statue_source_stats (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  dragon_id uuid references items(id) on delete set null,
  dragon_name text not null,
  rarity text not null,
  rarity_level text not null,
  data_available text not null,
  base_values jsonb not null default '{}'::jsonb,
  level_values jsonb not null default '{}'::jsonb
);

create table dragon_statue_source_metadata (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  dragon_id uuid references items(id) on delete set null,
  dragon_name text not null,
  dragon_rank text not null,
  element text not null,
  magestone_type text not null
);

create table dragon_statue_source_costs (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  dragon_rank text not null,
  level text not null,
  gold_cost text not null,
  magestone_cost text not null,
  cumulative_costs jsonb not null default '{}'::jsonb
);

alter table dragon_statue_source_stats enable row level security;
alter table dragon_statue_source_metadata enable row level security;
alter table dragon_statue_source_costs enable row level security;

create policy "Admins can manage dragon statue source stats" on dragon_statue_source_stats
for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage dragon statue source metadata" on dragon_statue_source_metadata
for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage dragon statue source costs" on dragon_statue_source_costs
for all to authenticated using (is_admin()) with check (is_admin());

with rows (external_key, entity_type, source_fingerprint) as (values
""" + string_values(list(dict.fromkeys(records))) + """
)
insert into source_records (catalog_source_id, external_key, entity_type, source_fingerprint)
select catalog_sources.id, rows.external_key, rows.entity_type, rows.source_fingerprint
from rows join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
on conflict (catalog_source_id, external_key, entity_type) do update
set source_fingerprint = excluded.source_fingerprint;
"""

    def add_insert(
        table: str,
        columns: str,
        entity_type: str,
        rows: list[tuple[str, ...]],
        select_columns: str,
        json_columns: set[str] = set(),
    ) -> None:
        nonlocal output
        output += f"\nwith rows ({columns}) as (values\n"
        column_names = [column.strip() for column in columns.split(",")]
        output += ",\n".join(
            "    ("
            + ", ".join(
                quote(value) + ("::jsonb" if column in json_columns else "")
                for column, value in zip(column_names, row, strict=True)
            )
            + ")"
            for row in rows
        )
        select_column_names = [column.strip() for column in select_columns.split(",")]
        select_expressions = [
            "source_records.id"
            if column == "source_record_id"
            else "items.id"
            if column == "dragon_id"
            else f"rows.{column}"
            for column in select_column_names
        ]
        output += f"""
)
insert into {table} ({select_columns})
select {', '.join(select_expressions)}
from rows
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = rows.external_key
  and source_records.entity_type = '{entity_type}'
left join items on lower(items.name) = lower(rows.dragon_name)
  and items.category = 'dragon'
on conflict (source_record_id) do update
set {', '.join(f'{column} = excluded.{column}' for column in select_column_names if column != 'source_record_id')};
"""

    add_insert(
        "dragon_statue_source_stats",
        "external_key, dragon_name, rarity, rarity_level, data_available, base_values, level_values",
        "dragon_statue_source_stat",
        [
            row[:5] + (row[5], row[6])
            for row in stats
        ],
        "source_record_id, dragon_id, dragon_name, rarity, rarity_level, data_available, base_values, level_values",
        {"base_values", "level_values"},
    )
    add_insert(
        "dragon_statue_source_metadata",
        "external_key, dragon_name, dragon_rank, element, magestone_type",
        "dragon_statue_source_metadata",
        metadata,
        "source_record_id, dragon_id, dragon_name, dragon_rank, element, magestone_type",
    )
    output += "\nwith rows (external_key, dragon_rank, level, gold_cost, magestone_cost, cumulative_costs) as (values\n"
    output += ",\n".join(
        f"    ({quote(key)}, {quote(rank)}, {quote(level)}, {quote(gold)}, {quote(stones)}, {quote(total)}::jsonb)"
        for key, rank, level, gold, stones, total in costs
    )
    output += """
)
insert into dragon_statue_source_costs (
  source_record_id, dragon_rank, level, gold_cost, magestone_cost, cumulative_costs
)
select source_records.id, rows.dragon_rank, rows.level, rows.gold_cost, rows.magestone_cost, rows.cumulative_costs
from rows
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = rows.external_key
  and source_records.entity_type = 'dragon_statue_source_cost'
on conflict (source_record_id) do update
set dragon_rank = excluded.dragon_rank, level = excluded.level, gold_cost = excluded.gold_cost,
    magestone_cost = excluded.magestone_cost, cumulative_costs = excluded.cumulative_costs;
"""
    Path(sys.argv[1]).write_text(output, encoding="utf-8")


if __name__ == "__main__":
    main()
