# Archero Hub Roadmap

This is the working handoff for future chats. It records the agreed product direction, completed foundation, remaining work, and reference workbooks.

## Product direction

Archero Hub is a community catalog and planner for Archero:

- A visual **loadout-first home page** modeled after the in-game equipment screen.
- A single, curator-managed **tier board** for items, heroes, dragons, pets, and spirits.
- A future **inventory/account planner** that lets visitors choose their owned items and eventually calculates Attack and HP.
- A curator **Admin** workspace for icon assignments, rankings, and verified game data.
- A detailed, source-backed game database. Do not invent numeric stats; preserve uncertain data as unverified with provenance.

## Current state

### Public site

- Production URL: `https://archero-hub.vercel.app`
- `/` is a loadout planner with:
  - Hero in the center.
  - Weapon, dragon, spirit, and bracelet on the left.
  - Armor, ring, spirit, and locket on the right.
  - Book and second ring below the hero.
  - Clickable equipment slots, an item-picker modal, local browser-owned-item state, hover cards, and mode recommendations.
  - Attack/HP deliberately shown as pending until verified calculation data exists.
- `/tier-lists` is a category-based board. It has no version dropdown and uses one starting-point list.
- Tier-board categories currently include Weapons, Heroes, Pets, Spirits, Dragons, Armor, Rings, Books, Bracelets, and Lockets.
- Pets and Spirits are separate concepts and must remain separate in the catalog and layout.

### Tier-list starting point

- The only remaining tier list is `Archero Discord Tier List` version `6.10.2`.
- The old empty `8.3.0` version was deleted.
- The list is the current starting point for curation, not an immutable source of truth.
- Weapon SS entries were normalized to S at the user's request.
- All six Demon King items start in S:
  - Demon King Spearshield
  - Demon King Warplate
  - Demon King Ring
  - Demon King Bracelet
  - Demon King Talisman
  - Demon King Grimoire
- The historical board ranks the original source entries. Newly cataloged items without a curator rank intentionally appear as `Unranked`.

### Current catalog

There are 131 active named catalog records, all with image paths:

| Category | Count |
|---|---:|
| Heroes | 31 |
| Dragons | 17 |
| Pets | 13 |
| Spirits | 7 |
| Weapons | 13 |
| Armor | 9 |
| Rings | 11 |
| Books | 10 |
| Bracelets | 10 |
| Lockets | 10 |

Notes:

- Three weapon-level icon folders are visual variants, not separate weapons.
- Rank-badge images are not catalog items.
- The corrected Celestial Bracer path is `/images/equipment/celestial-bracer-corrected.png`.
- All imported hero and dragon images are in `public/images/heroes/` and `public/images/dragons/`.
- Named pets are in `public/images/pets/`; equipment art is in `public/images/equipment/`.

### Administration

- `/admin` supports catalog browsing, icon selection, and ranking editing.
- Google OAuth is enabled.
- Admin database writes require the signed-in user to exist in the `admins` table.
- Admin icon media comes from `catalog_media`. Any newly added icon must be registered there or it will not be selectable.
- Saves must return an updated row; zero-row RLS updates must be shown as errors rather than success.

## Highest-priority next work

### Completed workbook foundation

- [x] Created workbook import, sheet, raw-row, and hero-bonus milestone tables with RLS.
- [x] Registered all 14 uploaded workbooks with SHA-256 fingerprints and source attribution.
- [x] Added a reusable `scripts/generate_hero_bonus_import.py` extractor for the All Hero Bonuses workbook.
- [x] Imported the first clean workbook slice as unpublished data:
  - 31 raw `stats` sheet rows.
  - 30 per-hero source records.
  - 268 Hero Bonus milestone effects.
- [x] Linked imported effects to their catalog heroes and exact source rows.

### Completed workbook provenance and clean-source staging

- [x] Preserved every workbook sheet and every non-empty source row:
  - 50 sheets across all 14 workbooks.
  - 4,060 raw source rows.
  - 50 sheet-level source records with workbook SHA-256 fingerprints.
- [x] Added deterministic, standard-library import generators for repeatable migrations.
- [x] Imported clean structured data as private, unreviewed staging records:
  - 87 weapon and hero skin entries.
  - 298 jewel level effects.
  - 32 medal entries.
  - 206 relic effect entries.
  - 227 hero assist/brave effects.
- [x] Imported the structured Pet workbook blocks as unreviewed, source-backed records:
  - 11 Pet profiles linked to exact catalog matches.
  - 39 Battle, Kindred, and Talent Skill records.
- [x] Imported Dragon Statue source data as unreviewed, source-backed records:
  - 44 dragon rarity-stat rows and 7 dragon metadata records, all linked to catalog dragons.
  - 120 rank-specific upgrade-cost rows.
- [x] Staged 139 unreviewed Glyph rows across Weapon, Armor, Bracelet, Locket, Ring, Book, and Spirit categories.
- [x] Kept source-derived tables behind Admin-only RLS. Nothing new is publicly shown or used for calculations until curator review.

### 1. Complete remaining workbook normalization

Continue the repeatable import pipeline from the preserved raw source data.

1. Normalize the remaining complex sources: Dragon Statues, Pets, Sigils, Glyphs, Outfits, Hatchery, Estate/Workers, and Quick Raid.
2. Link reviewed source entries to existing catalog item slugs whenever possible.
3. Add a curator review workflow before publishing calculations or numeric stats.
4. Keep workbook source records `unreviewed` until a curator verifies them.

Do not treat every spreadsheet cell as verified game truth. Several workbooks contain mixed tables, formulas, notes, blank formatted rows, and incomplete values.

### 2. Build real calculations

Use the imported data to calculate rather than guess:

- Hero base stats and all-hero bonuses.
- Equipment and skin bonuses.
- Pet and Spirit effects.
- Dragon and Dragon Statue bonuses.
- Relic, Jewel, Sigil, Glyph, Medal, Outfit, Estate, and Worker account bonuses.
- Final Attack, HP, damage bonuses, resistance, crit, and other visible build totals.

Requirements:

- Show calculation inputs and a transparent breakdown.
- Clearly mark missing/unknown sources.
- Keep account-wide bonuses separate from equipped-loadout bonuses.
- Add tests for formula parsing and known reference builds before showing totals publicly.

### 3. Finish catalog depth

- Add structured records for:
  - Weapon skins
  - Hero outfits/skins
  - Hero assists and brave effects
  - Sigils
  - Glyphs
  - Relics
  - Jewels
  - Medals
  - Dragon Statues
  - Hatchery/monster training
  - Workers, Estate, buildings, and account progression
  - Quick Raid rewards
- Add images where workbook assets or supplied icons are available.
- Add item relationships: skin-to-hero, skin-to-weapon, glyph-to-category, effect-to-stat, dragon-to-statue, and account-bonus applicability.
- Add rarity, level, star, evolution, and upgrade-cost data where supported by source workbooks.

### 4. Improve the loadout/inventory experience

- Replace static recommendation presets with database-backed builds once data is curated.
- Let visitors create a persistent account/inventory rather than browser-only owned-item state.
- Support equipment level, rarity, refinement, glyphs, skins, jewels, and star/evolution choices.
- Add shareable builds.
- Add a visual backpack/collection page inspired by the in-game collection screen.
- Keep the home-page layout hero-centered and use Spirits in the companion slots, not Pets.
- Consider separate pages/tabs for Pets and Spirits because they are distinct systems.

### 5. Expand Admin

- Make every catalog category editable: heroes, dragons, pets, spirits, skins, sigils, glyphs, relics, jewels, medals, and progression systems.
- Add bulk import previews and validation reports.
- Add an approval state for workbook-derived values.
- Add source/provenance display per field.
- Add a ranking editor with category filtering, drag-and-drop ordering, notes, and published/unpublished state.
- Add media upload/assignment workflows and prevent image cache issues by using versioned paths when replacing art.

## Workbook reference library

All workbooks currently live in `~/Downloads/`.

| Workbook | Key data | Import notes |
|---|---|---|
| `Archero All Hero bonuses.xlsx` | All-hero milestone bonuses | Clean hero-by-row table; high-priority normalization source. |
| `Assist Brave Hero List (LuhCaran, Sloth, Kyle, Chaos).xlsx` | Hero assist and brave effects | 227 source-backed effects imported as unreviewed. |
| `Archero.xlsx` | Weapon skins and hero skin bonuses | 87 source-backed skin entries imported as unreviewed. |
| `Archero - Dragon Statues.xlsx` | Dragon Statue stats, rarity, level, costs | 44 rarity-stat rows, 7 metadata records, and 120 costs imported as unreviewed. |
| `Archero Pets.xlsx` | Pet stats, milestones, battle skills, upgrade costs | 11 profiles and 39 skills imported as unreviewed; never merge with Spirits. |
| `Archero Sigils.xlsx` | Sigil effects, evolution, hidden stats, faith | Mixed blocks; parse with row grouping and source-cell provenance. |
| `Archero Glyphs.xlsx` | Glyph effects and rarity/upgrade tiers by equipment category | 139 category-specific rows staged as unreviewed; parse effects after curator review. |
| `Archero Relics.xlsx` | Relic base, advanced, exclusive, and star effects | 206 source-backed effect entries imported as unreviewed. |
| `Archero Jewels.xlsx` | Jewel levels and stat progression | 298 source-backed level effects imported as unreviewed. |
| `Archero Medals.xlsx` | Medal triggers, rarity, and enhancements | 32 source-backed entries imported as unreviewed. |
| `Archero Outfit stats.xlsx` | Outfit names, prices, bonuses, level costs, embedded art | Contains 96 embedded outfit PNGs; map each drawing anchor to its outfit row/name before importing. |
| `Archero Hatchery 4.8.4 (LanderZ, mrb, Shusaku, Abstrusity, LuhCaran).xlsx` | Monster training, zones, bosses, hatchery data | Useful for account progression; separate from Pet and Spirit equipment. |
| `Archero Workers, Estate.xlsx` | Workers, buildings, estate levels, costs | Account progression and total-stat calculations. |
| `QuickRaid 5.11 (LuhCaran, Pelmens, zkn).xlsx` | Quick Raid rewards and chapters | Future farming/reward planner. |

### Outfit workbook assets

- `Archero Outfit stats.xlsx` contains 96 embedded PNG images in `xl/media/`.
- They are actual outfit/hero art, not decorative images.
- The mapping must be built from worksheet drawing anchors plus the Outfits sheet rows.
- Extract to a temporary directory, generate a contact sheet for review, then copy only named/mapped images into the repository.

## Data-model guidance

Keep the current core tables and extend them rather than storing everything as text:

- `items`, `categories`, `catalog_media`
- `tier_lists`, `tier_rankings`, `modes`
- `item_statistics`, `item_stat_values`, `item_abilities`, `rarity_levels`
- Add source/import tables for raw workbook records and field-level provenance.

Likely future normalized tables:

- `hero_bonuses`, `hero_assist_effects`, `hero_skins`
- `weapon_skins`
- `dragon_statues`, `dragon_statue_levels`
- `pet_levels`, `pet_skills`
- `spirit_levels`, `spirit_skills`
- `sigils`, `sigil_effects`
- `glyphs`, `glyph_levels`
- `relics`, `relic_effects`
- `jewels`, `jewel_levels`
- `medals`
- `outfits`, `outfit_levels`
- `hatchery_monsters`, `hatchery_training`
- `estate_workers`, `estate_buildings`, `estate_levels`
- `quick_raid_rewards`
- `saved_inventories`, `inventory_items`, `inventory_upgrades`

## Engineering rules

- Never fabricate stats or rankings.
- Keep historic/community source rankings labeled and separate from curated current rankings if more versions are introduced later.
- Every import should be idempotent and migration-backed where it modifies production data.
- Register every new public image in `catalog_media` for Admin selection.
- Preserve user changes and do not overwrite curator-edited image/ranking data with blind reimports.
- Run lint and production build after frontend changes.
- Verify database migrations against production and verify deployed assets/pages after pushes.

## Completed foundation

- Supabase-backed catalog with public reads and admin-write RLS.
- Google sign-in for Admin.
- 131 named catalog items with image paths.
- Distinct Pets and Spirits categories.
- Hero-centered loadout page and local inventory selection.
- Historical 6.10.2 board converted into the single starting tier list.
- Books, Bracelets, Lockets, Pets, Spirits, Dragons, Heroes, Armor, Rings, and Weapons visible as tier-board categories.
- Corrected Celestial Bracer image path and Admin media registration.
