#!/usr/bin/env python3
"""Generate a migration that imports the All Hero Bonuses workbook."""

import hashlib
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS = {"m": MAIN_NS}


def sql_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def read_cells(path: Path) -> list[tuple[int, dict[str, str]]]:
    with ZipFile(path) as archive:
        shared_strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared_strings = ["".join(node.itertext()) for node in root.findall("m:si", NS)]

        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows = []
        for row in sheet.findall(".//m:sheetData/m:row", NS):
            cells = {}
            for cell in row.findall("m:c", NS):
                reference = cell.attrib["r"]
                column = re.match(r"[A-Z]+", reference)
                if not column:
                    continue
                value = cell.findtext("m:v", default="", namespaces=NS)
                if cell.attrib.get("t") == "s" and value:
                    value = shared_strings[int(value)]
                elif cell.attrib.get("t") == "inlineStr":
                    value = "".join(cell.itertext())
                if value:
                    cells[column.group()] = value
            if cells:
                rows.append((int(row.attrib["r"]), cells))
        return rows


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: generate_hero_bonus_import.py INPUT.xlsx OUTPUT.sql")

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    rows = read_cells(input_path)
    header = next(cells for row_number, cells in rows if row_number == 1)
    milestone_columns = [(column, header[column]) for column in sorted(header) if column != "A"]
    fingerprint = hashlib.sha256(input_path.read_bytes()).hexdigest()

    raw_rows = []
    bonus_rows = []
    source_rows = []
    for row_number, cells in rows:
        raw_rows.append(
            f"({row_number}, {sql_string(json.dumps(cells, ensure_ascii=True))}::jsonb)"
        )
        if row_number == 1 or "A" not in cells:
            continue

        external_key = f"all-hero-bonuses:stats:row:{row_number}"
        source_rows.append(
            f"({sql_string(external_key)}, 'hero_bonus_row', "
            f"{sql_string(f'{fingerprint}:row:{row_number}')})"
        )
        for column, milestone in milestone_columns:
            effect = cells.get(column)
            if effect and effect != "-":
                bonus_rows.append(
                    f"({sql_string(cells['A'])}, {sql_string(milestone)}, "
                    f"{sql_string(effect)}, {sql_string(external_key)})"
                )

    output_path.write_text(
        """with workbook as (
  select workbook_imports.id, workbook_imports.catalog_source_id
  from workbook_imports
  where workbook_imports.filename = 'Archero All Hero bonuses.xlsx'
),
sheet as (
  insert into workbook_sheets (workbook_import_id, name, row_count, header_values)
  select workbook.id, 'stats', 31, '["Level 20", "Level 60", "Level 120", "2\\u2606", "7\\u2606", "8\\u2606", "Brave 20", "Brave 40", "Brave 100"]'::jsonb
  from workbook
  on conflict (workbook_import_id, name) do update
  set row_count = excluded.row_count, header_values = excluded.header_values
  returning id, workbook_import_id
),
raw_rows (row_number, cell_values) as (
  values
"""
        + ",\n".join(f"    {row}" for row in raw_rows)
        + """
)
insert into workbook_rows (workbook_sheet_id, row_number, cell_values)
select sheet.id, raw_rows.row_number, raw_rows.cell_values
from sheet
cross join raw_rows
on conflict (workbook_sheet_id, row_number) do update
set cell_values = excluded.cell_values;

with workbook as (
  select workbook_imports.id, workbook_imports.catalog_source_id
  from workbook_imports
  where workbook_imports.filename = 'Archero All Hero bonuses.xlsx'
),
source_rows (external_key, entity_type, source_fingerprint) as (
  values
"""
        + ",\n".join(f"    {row}" for row in source_rows)
        + """
)
insert into source_records (catalog_source_id, external_key, entity_type, source_fingerprint)
select workbook.catalog_source_id, source_rows.external_key, source_rows.entity_type, source_rows.source_fingerprint
from workbook
cross join source_rows
on conflict (catalog_source_id, external_key, entity_type) do update
set source_fingerprint = excluded.source_fingerprint;

with bonuses (hero_name, milestone, effect, external_key) as (
  values
"""
        + ",\n".join(f"    {row}" for row in bonus_rows)
        + """
)
insert into hero_bonus_milestones (hero_id, milestone, effect, source_record_id)
select items.id, bonuses.milestone, bonuses.effect, source_records.id
from bonuses
join items on lower(items.name) = lower(bonuses.hero_name)
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = bonuses.external_key
  and source_records.entity_type = 'hero_bonus_row'
on conflict (hero_id, milestone, effect) do update
set source_record_id = excluded.source_record_id;
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
