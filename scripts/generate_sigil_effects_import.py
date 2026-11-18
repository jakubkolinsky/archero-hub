#!/usr/bin/env python3
"""Parse staged Sigil workbook rows into sigil, faith, and listing records.

Sigils sheet: 6-row blocks. Row 0 column A names the sigil; column B holds the
basic stat (row 1), an "Advance Effects" label (row 2), and advanced stats
(rows 3-5); column D holds evolution effects in order; column E holds hidden
stats; column F holds footnotes. Column G is a separate list headed "Not yet".

Faith sheet: a talent tree. Column A starts a tier ("TierN"); each following
row is a node whose column B is the first option and column C, when present, an
alternative. Columns E-I near the top hold faith point costs and blessing
point rules.

The unlabeled "chart" sheet stays raw-only in sigil_source_rows.

Usage: generate_sigil_effects_import.py OUTPUT.sql
"""

import hashlib
import json
import sys
from pathlib import Path

from generate_workbook_provenance_import import read_workbook, sql_string

WORKBOOK_PATH = Path("/home/jakubkolinsky/Downloads/Archero Sigils.xlsx")
BLOCK_HEIGHT = 6


def key(sheet: str, row: int) -> str:
    return sql_string(f"workbook:Archero Sigils.xlsx:sheet:{sheet}:row:{row}")


def jsonb(value) -> str:
    return sql_string(json.dumps(value, ensure_ascii=True)) + "::jsonb"


def clean(value: str | None) -> str:
    return " ".join((value or "").split())


def parse_sigils(rows: dict[int, dict[str, str]]):
    entries, listings = [], []
    starts = [r for r, cells in rows.items() if cells.get("A", "").startswith("Sigil")]
    for start in starts:
        name = clean(rows[start]["A"].split(":", 1)[1])
        block = [rows.get(start + offset, {}) for offset in range(BLOCK_HEIGHT)]
        if not name:
            if any(c.get(col) for c in block[1:] for col in "BDEF" if c.get(col) != "Advance Effects"):
                raise SystemExit(f"Unnamed sigil block at row {start} has data")
            continue
        if block[2].get("B") != "Advance Effects":
            raise SystemExit(f"Sigil block at row {start} lacks the Advance Effects label")
        entries.append(
            (
                start,
                start + BLOCK_HEIGHT - 1,
                name,
                clean(block[1].get("B")),
                [clean(c["B"]) for c in block[3:] if c.get("B")],
                [{"stage": i, "effect": clean(c["D"])} for i, c in enumerate((c for c in block[1:] if c.get("D")), 1)],
                [clean(c["E"]) for c in block if c.get("E") and c["E"] != "Hidden stats"],
                [clean(c["F"]) for c in block if c.get("F")],
            )
        )
    listed = [(r, cells["G"]) for r, cells in sorted(rows.items()) if cells.get("G")]
    label = listed[0][1]
    for row, value in listed[1:]:
        listings.append((row, clean(value.split(":", 1)[1]) if ":" in value else clean(value), label))
    return entries, listings


def parse_faith(rows: list[tuple[int, dict[str, str]]]):
    nodes, rules = [], []
    tier = None
    node_index = 0
    rarity_header = None
    for row, cells in rows:
        if cells.get("E") == "Falth point":
            rarity_header = {col: cells[col] for col in "FGHI" if col in cells}
            continue
        if cells.get("E") and cells.get("G", "").startswith("<---"):
            rules.append((row, "blessing_points", clean(cells["E"]), {"note": clean(cells["G"].lstrip("<-"))}))
        elif rarity_header and cells.get("E") and any(col in cells for col in rarity_header):
            rules.append((row, "point_cost", clean(cells["E"]), {rarity_header[c]: cells[c] for c in rarity_header if c in cells}))
        if cells.get("A", "").startswith("Tier"):
            tier = int(cells["A"][4:])
            node_index = 0
        if cells.get("B"):
            if tier is None:
                raise SystemExit(f"Faith row {row} has a node before any tier")
            node_index += 1
            options = [clean(cells[c]) for c in "BC" if cells.get(c)]
            nodes.append((row, tier, node_index, options))
    return nodes, rules


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate_sigil_effects_import.py OUTPUT.sql")
    sheets = dict(read_workbook(WORKBOOK_PATH))
    fingerprint = hashlib.sha256(WORKBOOK_PATH.read_bytes()).hexdigest()
    entries, listings = parse_sigils(dict(sheets["Sigils"]))
    nodes, rules = parse_faith(sheets["Faith"])

    entry_values = ",\n".join(
        f"    ({key('Sigils', s)}, {s}, {e}, {sql_string(n)}, {sql_string(basic)}, {jsonb(adv)}, {jsonb(evo)}, {jsonb(hidden)}, {jsonb(notes)})"
        for s, e, n, basic, adv, evo, hidden, notes in entries
    )
    listing_values = ",\n".join(
        f"    ({key('Sigils', r)}, {sql_string(n)}, {sql_string(label)})" for r, n, label in listings
    )
    node_values = ",\n".join(
        f"    ({key('Faith', r)}, {t}, {i}, {jsonb(opts)})" for r, t, i, opts in nodes
    )
    rule_values = ",\n".join(
        f"    ({key('Faith', r)}, {sql_string(kind)}, {sql_string(label)}, {jsonb(vals)})" for r, kind, label, vals in rules
    )

    staged = """staged as (
  select sigil_source_rows.id, source_records.external_key
  from sigil_source_rows
  join source_records on source_records.id = sigil_source_rows.source_record_id
  where source_records.entity_type = 'sigil_source_row'
)"""

    Path(sys.argv[1]).write_text(
        f"""-- Generated by scripts/generate_sigil_effects_import.py from Archero Sigils.xlsx
-- sha256 {fingerprint}. {len(entries)} sigils, {len(listings)} "{listings[0][2] if listings else ''}" listings,
-- {len(nodes)} faith nodes, {len(rules)} faith rules. Parsed from rows already staged in
-- sigil_source_rows; everything stays unreviewed. The unlabeled chart sheet is not parsed.
create table sigil_source_entries (
  id uuid primary key default gen_random_uuid(),
  sigil_source_row_id uuid not null unique references sigil_source_rows(id) on delete cascade,
  source_row_start integer not null check (source_row_start > 0),
  source_row_end integer not null check (source_row_end >= source_row_start),
  sigil_name text not null,
  basic_effect text not null,
  advanced_effects jsonb not null default '[]'::jsonb,
  evolution_effects jsonb not null default '[]'::jsonb,
  hidden_stats jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb
);

create table sigil_source_listings (
  id uuid primary key default gen_random_uuid(),
  sigil_source_row_id uuid not null unique references sigil_source_rows(id) on delete cascade,
  sigil_name text not null,
  list_label text not null
);

create table faith_source_nodes (
  id uuid primary key default gen_random_uuid(),
  sigil_source_row_id uuid not null unique references sigil_source_rows(id) on delete cascade,
  tier integer not null check (tier > 0),
  node_index integer not null check (node_index > 0),
  options jsonb not null,
  unique (tier, node_index)
);

create table faith_source_rules (
  id uuid primary key default gen_random_uuid(),
  sigil_source_row_id uuid not null unique references sigil_source_rows(id) on delete cascade,
  rule_kind text not null check (rule_kind in ('point_cost', 'blessing_points')),
  label text not null,
  rule_values jsonb not null
);

alter table sigil_source_entries enable row level security;
alter table sigil_source_listings enable row level security;
alter table faith_source_nodes enable row level security;
alter table faith_source_rules enable row level security;

create policy "Admins can manage sigil source entries" on sigil_source_entries
for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage sigil source listings" on sigil_source_listings
for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage faith source nodes" on faith_source_nodes
for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage faith source rules" on faith_source_rules
for all to authenticated using (is_admin()) with check (is_admin());

with {staged},
parsed (external_key, source_row_start, source_row_end, sigil_name, basic_effect, advanced_effects, evolution_effects, hidden_stats, notes) as (
  values
{entry_values}
)
insert into sigil_source_entries (
  sigil_source_row_id, source_row_start, source_row_end, sigil_name, basic_effect,
  advanced_effects, evolution_effects, hidden_stats, notes
)
select staged.id, parsed.source_row_start, parsed.source_row_end, parsed.sigil_name, parsed.basic_effect,
  parsed.advanced_effects, parsed.evolution_effects, parsed.hidden_stats, parsed.notes
from parsed
join staged on staged.external_key = parsed.external_key
on conflict (sigil_source_row_id) do update
set
  source_row_start = excluded.source_row_start,
  source_row_end = excluded.source_row_end,
  sigil_name = excluded.sigil_name,
  basic_effect = excluded.basic_effect,
  advanced_effects = excluded.advanced_effects,
  evolution_effects = excluded.evolution_effects,
  hidden_stats = excluded.hidden_stats,
  notes = excluded.notes;

with {staged},
parsed (external_key, sigil_name, list_label) as (
  values
{listing_values}
)
insert into sigil_source_listings (sigil_source_row_id, sigil_name, list_label)
select staged.id, parsed.sigil_name, parsed.list_label
from parsed
join staged on staged.external_key = parsed.external_key
on conflict (sigil_source_row_id) do update
set sigil_name = excluded.sigil_name, list_label = excluded.list_label;

with {staged},
parsed (external_key, tier, node_index, options) as (
  values
{node_values}
)
insert into faith_source_nodes (sigil_source_row_id, tier, node_index, options)
select staged.id, parsed.tier, parsed.node_index, parsed.options
from parsed
join staged on staged.external_key = parsed.external_key
on conflict (sigil_source_row_id) do update
set tier = excluded.tier, node_index = excluded.node_index, options = excluded.options;

with {staged},
parsed (external_key, rule_kind, label, rule_values) as (
  values
{rule_values}
)
insert into faith_source_rules (sigil_source_row_id, rule_kind, label, rule_values)
select staged.id, parsed.rule_kind, parsed.label, parsed.rule_values
from parsed
join staged on staged.external_key = parsed.external_key
on conflict (sigil_source_row_id) do update
set rule_kind = excluded.rule_kind, label = excluded.label, rule_values = excluded.rule_values;
"""
    )
    print(f"{len(entries)} sigils, {len(listings)} listings, {len(nodes)} faith nodes, {len(rules)} faith rules")


if __name__ == "__main__":
    main()
