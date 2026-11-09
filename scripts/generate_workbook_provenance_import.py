#!/usr/bin/env python3
"""Generate a migration that preserves every populated workbook row and sheet."""

import hashlib
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"m": MAIN_NS, "r": OFFICE_REL_NS}
REL_NS = {"r": PACKAGE_REL_NS}


def sql_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def read_workbook(path: Path) -> list[tuple[str, list[tuple[int, dict[str, str]]]]]:
    with ZipFile(path) as archive:
        shared_strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared_strings = ["".join(node.itertext()) for node in root.findall("m:si", NS)]

        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {
            relationship.attrib["Id"]: relationship.attrib["Target"].lstrip("/")
            for relationship in relationships
        }

        sheets = []
        for sheet in workbook.findall("m:sheets/m:sheet", NS):
            relationship_id = sheet.attrib[f"{{{OFFICE_REL_NS}}}id"]
            target = targets[relationship_id]
            if not target.startswith("xl/"):
                target = f"xl/{target}"

            worksheet = ET.fromstring(archive.read(target))
            rows = []
            for row in worksheet.findall(".//m:sheetData/m:row", NS):
                cells = {}
                for cell in row.findall("m:c", NS):
                    column = re.match(r"[A-Z]+", cell.attrib["r"])
                    if not column:
                        continue

                    value = cell.findtext("m:v", default="", namespaces=NS)
                    if cell.attrib.get("t") == "s" and value:
                        value = shared_strings[int(value)]
                    elif cell.attrib.get("t") == "inlineStr":
                        value = "".join(cell.itertext())
                    elif not value:
                        formula = cell.findtext("m:f", default="", namespaces=NS)
                        if formula:
                            value = f"={formula}"

                    if value:
                        cells[column.group()] = value

                if cells:
                    rows.append((int(row.attrib["r"]), cells))

            sheets.append((sheet.attrib["name"], rows))

        return sheets


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(
            "Usage: generate_workbook_provenance_import.py INPUT_DIRECTORY OUTPUT.sql"
        )

    input_directory = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    workbooks = []
    for path in sorted(input_directory.glob("*.xlsx")):
        workbooks.append((path.name, hashlib.sha256(path.read_bytes()).hexdigest(), read_workbook(path)))

    if len(workbooks) != 14:
        raise SystemExit(f"Expected 14 workbooks, found {len(workbooks)}")

    sheet_rows = []
    raw_rows = []
    source_rows = []
    for filename, fingerprint, sheets in workbooks:
        for sheet_name, rows in sheets:
            header_values = list(rows[0][1].values()) if rows else []
            sheet_rows.append(
                (
                    filename,
                    sheet_name,
                    len(rows),
                    json.dumps(header_values, ensure_ascii=True),
                )
            )
            source_rows.append(
                (
                    filename,
                    sheet_name,
                    f"{fingerprint}:sheet:{sheet_name}",
                )
            )
            for row_number, cells in rows:
                raw_rows.append(
                    (
                        filename,
                        sheet_name,
                        row_number,
                        json.dumps(cells, ensure_ascii=True),
                    )
                )

    def values(rows: list[tuple[str, ...]]) -> str:
        return ",\n".join(
            "    (" + ", ".join(sql_string(value) for value in row) + ")" for row in rows
        )

    sheet_values = ",\n".join(
        f"    ({sql_string(filename)}, {sql_string(sheet_name)}, {row_count}, "
        f"{sql_string(headers)}::jsonb)"
        for filename, sheet_name, row_count, headers in sheet_rows
    )
    raw_values = ",\n".join(
        f"    ({sql_string(filename)}, {sql_string(sheet_name)}, {row_number}, "
        f"{sql_string(cells)}::jsonb)"
        for filename, sheet_name, row_number, cells in raw_rows
    )
    source_values = values(source_rows)

    output_path.write_text(
        """with sheet_data (filename, name, row_count, header_values) as (
  values
"""
        + sheet_values
        + """
)
insert into workbook_sheets (workbook_import_id, name, row_count, header_values)
select workbook_imports.id, sheet_data.name, sheet_data.row_count, sheet_data.header_values
from sheet_data
join workbook_imports on workbook_imports.filename = sheet_data.filename
on conflict (workbook_import_id, name) do update
set
  row_count = excluded.row_count,
  header_values = excluded.header_values;

with raw_rows (filename, sheet_name, row_number, cell_values) as (
  values
"""
        + raw_values
        + """
)
insert into workbook_rows (workbook_sheet_id, row_number, cell_values)
select workbook_sheets.id, raw_rows.row_number, raw_rows.cell_values
from raw_rows
join workbook_imports on workbook_imports.filename = raw_rows.filename
join workbook_sheets
  on workbook_sheets.workbook_import_id = workbook_imports.id
  and workbook_sheets.name = raw_rows.sheet_name
on conflict (workbook_sheet_id, row_number) do update
set cell_values = excluded.cell_values;

with sheet_sources (filename, sheet_name, source_fingerprint) as (
  values
"""
        + source_values
        + """
)
insert into source_records (
  catalog_source_id,
  external_key,
  entity_type,
  source_fingerprint
)
select
  workbook_imports.catalog_source_id,
  'workbook:' || sheet_sources.filename || ':sheet:' || sheet_sources.sheet_name,
  'workbook_sheet',
  sheet_sources.source_fingerprint
from sheet_sources
join workbook_imports on workbook_imports.filename = sheet_sources.filename
on conflict (catalog_source_id, external_key, entity_type) do update
set source_fingerprint = excluded.source_fingerprint;
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
