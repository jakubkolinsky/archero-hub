#!/usr/bin/env python3
"""Stage Outfit workbook records and map their embedded portraits.

The Outfits sheet is laid out in 11-row blocks. Each block holds up to six
outfits side by side in column triples (name, label, value). The portrait for
an outfit is anchored in the name column, two rows below the name. This script
uses those drawing anchors, never image order, to map art to outfit names.

Hero ownership is not written on the Outfits sheet. A block is attributed to a
hero only when the Cheap Outfits sheet names the hero for at least one outfit
in that block and no outfit in the block disagrees. Everything else is left
unattributed for curator review.

Usage: generate_outfit_workbook_import.py OUTPUT.sql [IMAGE_DIR]
"""

import hashlib
import json
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

from generate_workbook_provenance_import import read_workbook, sql_string

WORKBOOK_PATH = Path("/home/jakubkolinsky/Downloads/Archero Outfit stats.xlsx")
WORKBOOK_NAME = WORKBOOK_PATH.name
SHEET = "Outfits"
BLOCK_HEIGHT = 11
PUBLIC_PREFIX = "/images/outfits/"
LEVEL_LABELS = [
    "Level 5  (All Heroes)",
    "Level 10",
    "Level 20 (All Heroes)",
    "Level 30",
    "Level 40 (All Heroes)",
    "Level 50",
    "Level 60 (All Heroes)",
    "Level 70",
    "Level 80 (All Heroes)",
]
# Cheap Outfits sheet spellings that differ from the Outfits sheet.
CHEAP_NAME_ALIASES = {"shamanssacrifice": "shamansacrifice"}
# Cheap Outfits hero labels that are nicknames for catalog heroes.
HERO_ALIASES = {"Cat": "Meowgik", "Ayaya": "Ayana"}


def column_letter(index: int) -> str:
    return chr(ord("A") + index)


def norm(value: str) -> str:
    key = re.sub(r"[^a-z0-9]", "", value.lower())
    return CHEAP_NAME_ALIASES.get(key, key)


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def portrait_anchors(archive: zipfile.ZipFile) -> dict[tuple[int, str], str]:
    """Return {(1-based row, column letter): media filename} for the Outfits sheet."""
    workbook = archive.read("xl/workbook.xml").decode()
    sheet_rid = re.search(rf'<sheet [^>]*name="{SHEET}"[^>]*r:id="(rId\d+)"', workbook).group(1)
    workbook_rels = archive.read("xl/_rels/workbook.xml.rels").decode()
    sheet_path = re.search(rf'Id="{sheet_rid}"[^>]*Target="([^"]+)"', workbook_rels).group(1)
    sheet_file = Path(sheet_path).name
    sheet_rels = archive.read(f"xl/worksheets/_rels/{sheet_file}.rels").decode()
    drawing_file = Path(re.search(r'Target="([^"]*drawing\d+\.xml)"', sheet_rels).group(1)).name
    drawing = archive.read(f"xl/drawings/{drawing_file}").decode()
    drawing_rels = archive.read(f"xl/drawings/_rels/{drawing_file}.rels").decode()
    media = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="\.\./media/([^"]+)"', drawing_rels))

    anchors: dict[tuple[int, str], str] = {}
    for anchor in re.findall(r"<xdr:(?:oneCell|twoCell)Anchor.*?</xdr:(?:oneCell|twoCell)Anchor>", drawing, re.S):
        start = re.search(r"<xdr:from><xdr:col>(\d+)</xdr:col>.*?<xdr:row>(\d+)</xdr:row>", anchor, re.S)
        col, row = int(start.group(1)), int(start.group(2)) + 1
        # Portraits sit two rows below the outfit name; other anchors are currency icons.
        if (row - 3) % BLOCK_HEIGHT != 0:
            continue
        embed = re.search(r'r:embed="(rId\d+)"', anchor).group(1)
        anchors[(row - 2, column_letter(col))] = media[embed]
    return anchors


def main() -> None:
    if len(sys.argv) not in (2, 3):
        raise SystemExit("Usage: generate_outfit_workbook_import.py OUTPUT.sql [IMAGE_DIR]")
    output_path = Path(sys.argv[1])
    image_dir = Path(sys.argv[2]) if len(sys.argv) == 3 else None

    workbook_bytes = WORKBOOK_PATH.read_bytes()
    fingerprint = hashlib.sha256(workbook_bytes).hexdigest()
    sheets = dict(read_workbook(WORKBOOK_PATH))
    rows = dict(sheets[SHEET])

    cheap_heroes: dict[str, str] = {}
    for _, cells in sheets["Cheap Outfits"]:
        if cells.get("A") and cells.get("B") and cells["A"] != "Hero":
            cheap_heroes[norm(cells["B"])] = cells["A"].strip()

    with zipfile.ZipFile(WORKBOOK_PATH) as archive:
        anchors = portrait_anchors(archive)
        outfits = []
        block_heroes: dict[int, set[str]] = {}
        for block_start in range(1, max(rows) + 1, BLOCK_HEIGHT):
            header = rows.get(block_start, {})
            for col_index in range(0, 26, 3):
                name_col = column_letter(col_index)
                label_col = column_letter(col_index + 1)
                value_col = column_letter(col_index + 2)
                if header.get(label_col) != "Skin Price":
                    continue
                block = [rows.get(block_start + offset, {}) for offset in range(BLOCK_HEIGHT)]
                labels = [cells.get(label_col) for cells in block]
                if labels[1] != "Unlock Stats" or labels[2:] != LEVEL_LABELS:
                    raise SystemExit(f"Unexpected layout at row {block_start} column {name_col}")
                name = header.get(name_col, "").strip()
                media_file = anchors.pop((block_start, name_col), None)
                if name and norm(name) in cheap_heroes:
                    block_heroes.setdefault(block_start, set()).add(cheap_heroes[norm(name)])
                outfits.append(
                    {
                        "row": block_start,
                        "col": name_col,
                        "name": name,
                        "price": block[0].get(value_col, ""),
                        "unlock": block[1].get(value_col, ""),
                        "levels": [
                            {"level": re.match(r"Level (\d+)", label).group(1), "all_heroes": "All Heroes" in label, "effect": cells.get(value_col, "")}
                            for label, cells in zip(LEVEL_LABELS, block[2:])
                        ],
                        "media": media_file,
                    }
                )
        if anchors:
            raise SystemExit(f"Portrait anchors without an outfit slot: {anchors}")

        name_counts: dict[str, int] = {}
        for outfit in outfits:
            name_counts[outfit["name"]] = name_counts.get(outfit["name"], 0) + 1

        for outfit in outfits:
            heroes = block_heroes.get(outfit["row"], set())
            outfit["hero_label"] = next(iter(heroes)) if len(heroes) == 1 else ""
            outfit["hero_name"] = HERO_ALIASES.get(outfit["hero_label"], outfit["hero_label"])
            base = slugify(outfit["name"]) if outfit["name"] else "unnamed"
            if not outfit["name"] or name_counts[outfit["name"]] > 1:
                base += f"-r{outfit['row']}{outfit['col'].lower()}"
            outfit["slug"] = base
            outfit["image_path"] = PUBLIC_PREFIX + base + ".png" if outfit["media"] else ""
            outfit["key"] = f"workbook:{WORKBOOK_NAME}:sheet:{SHEET}:outfit:{outfit['row']}{outfit['col']}"

        if image_dir is not None:
            image_dir.mkdir(parents=True, exist_ok=True)
            for outfit in outfits:
                if outfit["media"]:
                    data = archive.read(f"xl/media/{outfit['media']}")
                    (image_dir / f"{outfit['slug']}.png").write_bytes(data)

    def outfit_values() -> str:
        lines = []
        for o in outfits:
            lines.append(
                "    ("
                + ", ".join(
                    [
                        sql_string(o["key"]),
                        sql_string(o["name"]),
                        sql_string(o["slug"]),
                        sql_string(o["hero_label"]),
                        sql_string(o["hero_name"]),
                        sql_string(o["price"]),
                        sql_string(o["unlock"]),
                        sql_string(json.dumps(o["levels"], ensure_ascii=True)) + "::jsonb",
                        sql_string(o["image_path"]),
                        sql_string(o["media"] or ""),
                        str(o["row"]),
                        sql_string(o["col"]),
                    ]
                )
                + ")"
            )
        return ",\n".join(lines)

    source_values = ",\n".join(
        f"    ({sql_string(o['key'])}, 'outfit_source_entry', "
        f"{sql_string(fingerprint + ':sheet:' + SHEET + ':outfit:' + str(o['row']) + o['col'])})"
        for o in outfits
    )

    output_path.write_text(
        f"""-- Generated by scripts/generate_outfit_workbook_import.py from {WORKBOOK_NAME}
-- sha256 {fingerprint}. {len(outfits)} outfits, {sum(1 for o in outfits if o['media'])} mapped portraits.
create table outfit_source_entries (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  outfit_name text not null,
  outfit_slug text not null unique,
  hero_id uuid references items(id) on delete set null,
  source_hero_label text not null,
  price_description text not null,
  unlock_effect text not null,
  level_effects jsonb not null default '[]'::jsonb,
  image_url text,
  source_media_file text,
  source_row integer not null check (source_row > 0),
  source_column text not null
);

alter table outfit_source_entries enable row level security;

create policy "Admins can manage outfit source entries" on outfit_source_entries
for all to authenticated using (is_admin()) with check (is_admin());

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

with outfits (
  external_key, outfit_name, outfit_slug, source_hero_label, hero_name, price_description,
  unlock_effect, level_effects, image_url, source_media_file, source_row, source_column
) as (
  values
{outfit_values()}
)
insert into outfit_source_entries (
  source_record_id, outfit_name, outfit_slug, hero_id, source_hero_label, price_description,
  unlock_effect, level_effects, image_url, source_media_file, source_row, source_column
)
select
  source_records.id,
  outfits.outfit_name,
  outfits.outfit_slug,
  items.id,
  outfits.source_hero_label,
  outfits.price_description,
  outfits.unlock_effect,
  outfits.level_effects,
  nullif(outfits.image_url, ''),
  nullif(outfits.source_media_file, ''),
  outfits.source_row,
  outfits.source_column
from outfits
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = outfits.external_key
  and source_records.entity_type = 'outfit_source_entry'
left join items
  on outfits.hero_name <> ''
  and lower(items.name) = lower(outfits.hero_name)
  and items.category = 'hero'
on conflict (source_record_id) do update
set
  outfit_name = excluded.outfit_name,
  outfit_slug = excluded.outfit_slug,
  hero_id = excluded.hero_id,
  source_hero_label = excluded.source_hero_label,
  price_description = excluded.price_description,
  unlock_effect = excluded.unlock_effect,
  level_effects = excluded.level_effects,
  image_url = excluded.image_url,
  source_media_file = excluded.source_media_file,
  source_row = excluded.source_row,
  source_column = excluded.source_column;

insert into catalog_media (path, label)
select image_url, 'Outfit: ' || case when outfit_name = '' then 'Unnamed (' || outfit_slug || ')' else outfit_name end
from outfit_source_entries
where image_url is not null
on conflict (path) do nothing;
"""
    )

    attributed = sum(1 for o in outfits if o["hero_name"])
    print(f"{len(outfits)} outfits, {attributed} hero-attributed, wrote {output_path}")
    for start, heroes in sorted(block_heroes.items()):
        if len(heroes) > 1:
            print(f"warning: block {start} has conflicting heroes {sorted(heroes)}")


if __name__ == "__main__":
    main()
