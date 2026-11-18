#!/usr/bin/env python3
"""Stage Quick Raid chapter rewards from the QuickRaid workbook.

"Hero Rewards" and "Normal Rewards" have one row per chapter (column A) and one
reward column per header icon. The header has no text: each column is keyed by
its header icon, which is copied to the public image folder so curators can
label it. Only unambiguous icons (XP and the seven equipment scrolls) get a
label here; the rest stay unlabeled.

Some range cells were coerced to spreadsheet dates (e.g. 45081 = 2023-06-04).
They are kept verbatim and a recovered "day-month" range is added with
`date_recovered: true` for curator confirmation.

Screen_QuickRaid, Data_Screen, and Loot_Item are lookup/UI scaffolding and are
left raw-only.

Usage: generate_quick_raid_import.py OUTPUT.sql [IMAGE_DIR]
"""

import datetime
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path

from generate_workbook_provenance_import import read_workbook, sql_string

WORKBOOK_PATH = Path("/home/jakubkolinsky/Downloads/QuickRaid 5.11 (LuhCaran, Pelmens, zkn).xlsx")
SHEETS = {"Hero Rewards": "hero", "Normal Rewards": "normal"}
PUBLIC_PREFIX = "/images/quick-raid/"
# Labels for header icons that are unambiguous, keyed by workbook media file.
ICON_LABELS_BY_NAME = {
    "image7.jpg": "XP",
    "image25.jpg": "Weapon Scroll",
    "image3.jpg": "Armor Scroll",
    "image23.jpg": "Ring Scroll",
    "image39.jpg": "Pet Scroll",
    "image10.jpg": "Locket Scroll",
    "image28.jpg": "Bracelet Scroll",
    "image18.jpg": "Spellbook Scroll",
}
EXCEL_EPOCH = datetime.date(1899, 12, 30)


def header_icons(archive: zipfile.ZipFile, sheet: str) -> dict[str, str]:
    workbook = archive.read("xl/workbook.xml").decode()
    rid = re.search(rf'<sheet [^>]*name="{re.escape(sheet)}"[^>]*r:id="(rId\d+)"', workbook).group(1)
    rels = archive.read("xl/_rels/workbook.xml.rels").decode()
    sheet_file = Path(re.search(rf'Id="{rid}"[^>]*Target="([^"]+)"', rels).group(1)).name
    sheet_rels = archive.read(f"xl/worksheets/_rels/{sheet_file}.rels").decode()
    drawing_file = Path(re.search(r'Target="([^"]*drawing\d+\.xml)"', sheet_rels).group(1)).name
    drawing = archive.read(f"xl/drawings/{drawing_file}").decode()
    media = dict(
        re.findall(r'Id="(rId\d+)"[^>]*Target="\.\./media/([^"]+)"', archive.read(f"xl/drawings/_rels/{drawing_file}.rels").decode())
    )
    icons = {}
    for anchor in re.findall(r"<xdr:(?:oneCell|twoCell)Anchor.*?</xdr:(?:oneCell|twoCell)Anchor>", drawing, re.S):
        col, row = map(int, re.search(r"<xdr:from><xdr:col>(\d+)</xdr:col>.*?<xdr:row>(\d+)</xdr:row>", anchor, re.S).groups())
        if row == 0:
            icons[chr(ord("A") + col)] = media[re.search(r'r:embed="(rId\d+)"', anchor).group(1)]
    return icons


def parse_value(raw: str) -> dict:
    entry: dict = {"raw": raw}
    if raw == "-":
        return entry
    match = re.fullmatch(r"(\d+(?:\.\d+)?)(k?)(?:-(\d+(?:\.\d+)?)(k?))?", raw)
    if match:
        low, low_k, high, high_k = match.groups()
        scale_high = 1000 if high_k else 1
        scale_low = 1000 if (low_k or (high_k and not low_k)) else 1
        low_value = float(low) * scale_low
        high_value = float(high) * scale_high if high else low_value
        if not high and float(low).is_integer() and float(low) > 40000:
            date = EXCEL_EPOCH + datetime.timedelta(days=int(float(low)))
            entry.update({"min": date.day, "max": date.month, "date_recovered": True})
        else:
            entry.update({"min": low_value, "max": high_value})
    return entry


def main() -> None:
    if len(sys.argv) not in (2, 3):
        raise SystemExit("Usage: generate_quick_raid_import.py OUTPUT.sql [IMAGE_DIR]")
    image_dir = Path(sys.argv[2]) if len(sys.argv) == 3 else None
    fingerprint = hashlib.sha256(WORKBOOK_PATH.read_bytes()).hexdigest()
    sheets = dict(read_workbook(WORKBOOK_PATH))
    chapters, columns = [], []
    icon_files: set[str] = set()

    with zipfile.ZipFile(WORKBOOK_PATH) as archive:
        for sheet, mode in SHEETS.items():
            icons = header_icons(archive, sheet)
            for column, media in sorted(icons.items(), key=lambda item: (len(item[0]), item[0])):
                slug = Path(media).stem
                path = PUBLIC_PREFIX + slug + Path(media).suffix
                columns.append((mode, column, media, path, ICON_LABELS_BY_NAME.get(media, "")))
                icon_files.add(media)
            for row, cells in sheets[sheet]:
                if row == 1:
                    continue
                chapter = int(float(cells["A"]))
                rewards = {}
                for column in icons:
                    if column in cells:
                        rewards[column] = parse_value(cells[column].strip())
                extras = {c: v for c, v in cells.items() if c != "A" and c not in icons}
                chapters.append((sheet, mode, row, chapter, rewards, extras))
        if image_dir is not None:
            image_dir.mkdir(parents=True, exist_ok=True)
            for media in sorted(icon_files):
                (image_dir / media).write_bytes(archive.read(f"xl/media/{media}"))

    def key(sheet: str, row: int) -> str:
        return f"workbook:{WORKBOOK_PATH.name}:sheet:{sheet}:row:{row}"

    source_values = ",\n".join(
        f"    ({sql_string(key(s, r))}, 'quick_raid_source_chapter', {sql_string(f'{fingerprint}:sheet:{s}:row:{r}')})"
        for s, _, r, _, _, _ in chapters
    )
    chapter_values = ",\n".join(
        f"    ({sql_string(key(s, r))}, {sql_string(m)}, {c}, {r}, "
        f"{sql_string(json.dumps(rw, ensure_ascii=True, sort_keys=True))}::jsonb, "
        f"{sql_string(json.dumps(ex, ensure_ascii=True, sort_keys=True))}::jsonb)"
        for s, m, r, c, rw, ex in chapters
    )
    column_values = ",\n".join(
        f"    ({sql_string(m)}, {sql_string(c)}, {sql_string(media)}, {sql_string(path)}, {sql_string(label)})"
        for m, c, media, path, label in columns
    )
    date_cells = sum(1 for *_, rw, _ in chapters for v in rw.values() if v.get("date_recovered"))

    Path(sys.argv[1]).write_text(
        f"""-- Generated by scripts/generate_quick_raid_import.py from {WORKBOOK_PATH.name}
-- sha256 {fingerprint}. {len(chapters)} chapter rows, {len(columns)} reward columns,
-- {date_cells} date-coerced cells recovered and flagged. Everything stays unreviewed.
create table quick_raid_reward_columns (
  mode text not null check (mode in ('hero', 'normal')),
  source_column text not null,
  source_media_file text not null,
  icon_url text not null,
  label text not null default '',
  primary key (mode, source_column)
);

create table quick_raid_source_chapters (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  mode text not null check (mode in ('hero', 'normal')),
  chapter integer not null check (chapter > 0),
  source_row integer not null check (source_row > 0),
  rewards jsonb not null default '{{}}'::jsonb,
  unlabeled_cells jsonb not null default '{{}}'::jsonb,
  unique (mode, chapter)
);

alter table quick_raid_reward_columns enable row level security;
alter table quick_raid_source_chapters enable row level security;

create policy "Admins can manage quick raid reward columns" on quick_raid_reward_columns
for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage quick raid source chapters" on quick_raid_source_chapters
for all to authenticated using (is_admin()) with check (is_admin());

insert into quick_raid_reward_columns (mode, source_column, source_media_file, icon_url, label)
values
{column_values}
on conflict (mode, source_column) do update
set source_media_file = excluded.source_media_file, icon_url = excluded.icon_url;

insert into catalog_media (path, label)
select distinct on (icon_url) icon_url, 'Quick Raid reward: ' || coalesce(nullif(label, ''), source_media_file)
from quick_raid_reward_columns
order by icon_url, label desc
on conflict (path) do nothing;

with source_rows (external_key, entity_type, source_fingerprint) as (
  values
{source_values}
)
insert into source_records (catalog_source_id, external_key, entity_type, source_fingerprint)
select catalog_sources.id, source_rows.external_key, source_rows.entity_type, source_rows.source_fingerprint
from source_rows
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
on conflict (catalog_source_id, external_key, entity_type) do update
set source_fingerprint = excluded.source_fingerprint;

with parsed (external_key, mode, chapter, source_row, rewards, unlabeled_cells) as (
  values
{chapter_values}
)
insert into quick_raid_source_chapters (source_record_id, mode, chapter, source_row, rewards, unlabeled_cells)
select source_records.id, parsed.mode, parsed.chapter, parsed.source_row, parsed.rewards, parsed.unlabeled_cells
from parsed
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = parsed.external_key
  and source_records.entity_type = 'quick_raid_source_chapter'
on conflict (source_record_id) do update
set
  mode = excluded.mode,
  chapter = excluded.chapter,
  source_row = excluded.source_row,
  rewards = excluded.rewards,
  unlabeled_cells = excluded.unlabeled_cells;
"""
    )
    print(f"{len(chapters)} chapters, {len(columns)} columns, {len(icon_files)} icons, {date_cells} date-recovered cells")


if __name__ == "__main__":
    main()
