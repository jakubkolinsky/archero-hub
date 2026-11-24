# Archero Hub Roadmap

This is the working handoff for future chats. It records the agreed product direction, completed foundation, remaining work, and reference workbooks.

## Next session

### State at end of 2026-11-24

- Live: workbook imports (unreviewed, Admin-only), offline catalog snapshot fallback, redesigned loadout, real items in the recommended builds (loadout uses the published tier list), Next.js 16.4.6 (no known vulnerabilities), the Attack/HP calculator in the loadout (phase 1), and the fix for owned items being wiped on page load. Everything is deployed; nothing is pending.

### To do, in order

1. [x] **Deploy the placeholder fix.** Live since 2026-11-24.
2. [ ] **Decide:** swap the C-tier Book (Enlightenment) and Locket (Angel Locket) in the recommended builds for S-tier options? (Books: Arcanum of Time, Demon King Grimoire, Ice Realm. Lockets: Celestial Talisman, Counterattack Charm, Demon King Talisman.)
3. [x] **Patch Next.js 16.4.3 → 16.4.6.** Live; `npm audit` reports 0 vulnerabilities and builds no longer stop on the security notice.
4. [x] **Attack/HP calculator in the loadout, phase 1.** Live since 2026-11-24, verified in production (example shows 251,569). See plan below.
5. [ ] **Get an HP reference build**: a screenshot of the Max HP breakdown with its footer totals, to verify `hp.ts` like Attack.
6. [ ] **Curator review workflow** in Admin (approve/reject unreviewed source records). Needed before any workbook value feeds public totals.
7. [ ] Curator follow-ups from imports: label 9 Quick Raid icons, assign heroes to 54 outfits, name `unnamed-r298m`, confirm 45 date-recovered Quick Raid cells, and confirm whether glyph fractions like `0.05` mean 5%.
8. [ ] **Calculator phase 2** (data-backed prefill, below). Optional phase-1 polish: an equipment helper (level value + slot boost + rarity boost → stat via `equipmentStat()`), and per-mode or shareable saved calculator builds.

### Plan: Attack/HP calculator in the loadout

The formulas are done; the gap is **input data**. No workbook has equipment base stats per level/rarity, slot-type boosts, rarity boosts, or hero base/level growth. The reference build used values like Trident Lv1 = 3,750 with a 34.5% slot boost and 30% rarity boost.

**Phase 1: "your numbers" calculator (no new data needed)** — done 2026-11-24

- Implemented in `src/components/stat-calculator.tsx` with state logic in `src/lib/calculator/user-build.ts` (tested in `user-build.test.ts`). The example button loads the verified Atreus build (`reference-build.ts`) and shows 251,569.
- The original plan, for reference:

- Replace the "Needs reviewed data" strip with live **Attack** and **HP** values, plus a "Breakdown" button.
- The breakdown panel lists contributions grouped by stage (Count, Weapon, Attack%, Outside, Multiplier; Count and HP% for HP), exactly like the reference calculator.
- Prefill what we can derive from the loadout (e.g. hero base Atreus 150/600 once hero base stats are entered as reviewed data); every other line is a **user-editable row** (label, source, stage, value), with presets such as "Equipment", "Relic", "Gem (outside)", "Sigil imprint", "Combat buff (multiplier)".
- Equipment slots get a small "stat" field so users can type the item's Attack/HP from the game. `equipmentStat()` can derive it from level value + slot boost + rarity boost if the user enters those.
- Save per-browser in localStorage (like owned items); add "load reference build" to demo with the verified 251,569 example.
- Clearly label totals as **user-entered**; nothing is presented as verified game data.

**Phase 2: data-backed prefill**

- Add a `stat_contributions` model: item/system + level/star/rarity condition → stat (attack/hp), stage, value, `source_record_id`, review status.
- Map reviewed workbook data into it: hero all-hero bonuses, relics, jewels, dragon statues, skins/outfits, estate workers/buildings, hatchery training.
- Source equipment base stats and boost tables (ask whether the reference calculator's 8.3.0 data can be used with permission, or collect from the game).
- Add an account panel (hero levels/stars, altar breaks, estate, relics) kept separate from the equipped loadout.
- Every prefilled line shows its source; unreviewed lines are excluded from public totals.

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
  - Weapon, Ring 1, Spirit 1, and Bracelet on the left.
  - Armor, Ring 2, Spirit 2, and Locket on the right.
  - Book and Dragon below the hero.
  - Clickable equipment slots, an item-picker modal, local browser-owned-item state, hover cards, and mode recommendations.
  - An Attack/HP calculator under the hero: the verified formula with numbers the player enters (per equipped item plus free lines by formula step), a step-by-step breakdown, and a "Load example (Atreus)" button. Saved per browser; no item stats are prefilled yet.
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
- [x] Staged 635 unreviewed Sigil rows from the Sigils, Faith, and chart sheets.
- [x] Mapped and imported the Outfit workbook (`scripts/generate_outfit_workbook_import.py`):
  - 93 outfit entries with price, unlock stat, and Level 5–80 effects, staged as unreviewed in `outfit_source_entries`.
  - 93 portraits mapped by drawing anchor (not image order) and copied to `public/images/outfits/`, all registered in `catalog_media`.
  - The other 3 embedded images are upgrade-ticket currency icons, not outfits.
  - Hero ownership is only attributed when the Cheap Outfits sheet corroborates the block: 39 outfits labeled, 35 linked to catalog heroes (`Cat` → Meowgik, `Ayaya` → Ayana). The 4 `Racoon` outfits have no catalog match. The other 54 outfits need curator hero assignment.
  - Needs curator review: the outfit at row 298 column M has no name in the workbook (`unnamed-r298m`); "Sweet Proposal" and "Cherry Blossom Romance" each appear twice with different art, so their slugs carry a row/column suffix.
  - Not yet imported: the Level up Cost sheet (outfit stone and ticket costs).
- [x] Parsed the 139 staged Glyph rows (`scripts/generate_glyph_effects_import.py`):
  - 27 section base stats (`glyph_source_base_stats`) and 112 glyph effects (`glyph_source_effects`) across 7 categories; every staged row is linked.
  - Tier values are kept verbatim with a parsed `number` only for bare numbers and `percent` only for explicit `%` strings. Curators must confirm whether fractions like `0.05` mean 5%.
  - Weapon sheet's `ALE` tier header is normalized to `AL`; the original header is kept on each value.
  - Needs curator review: the 4th section on each sheet (3rd on Spirit) has no rarity label (stored as `''`); Locket and Ring SS glyphs have no name; the Glyph "Level up costs" sheet is not parsed yet.
  - The earlier `glyph_source_rows.glyph_name` for Spirit rows is unreliable (it picks column H, a tier column on that sheet); use `glyph_source_effects` instead.
- [x] Parsed the staged Sigil rows (`scripts/generate_sigil_effects_import.py`):
  - 84 sigils in `sigil_source_entries` with basic stat, advanced stats, ordered evolution effects, hidden stats, and footnotes (an empty template block at row 505 is skipped).
  - 29 names from the Sigils sheet's separate "Not yet" list in `sigil_source_listings`; none overlap the 84 documented sigils.
  - Faith talent tree: 148 nodes across tiers 1–25 in `faith_source_nodes` (each node has one option or two alternatives); tiers 26–40 are empty in the workbook. Tiers 14–20 list stat names without values.
  - 8 faith rules in `faith_source_rules`: point costs (Unlock/Enhance/Advance/Evolve by sigil rarity) and blessing point multipliers.
  - The unlabeled `chart` sheet is left raw-only; its numbers have no headers to interpret.
- [x] Staged Quick Raid rewards (`scripts/generate_quick_raid_import.py`):
  - 132 chapter rows (Hero and Normal, chapters 1–66) in `quick_raid_source_chapters`, with raw values plus parsed `min`/`max` (`k` = thousands).
  - Reward columns have icon-only headers: 30 columns in `quick_raid_reward_columns`, 17 distinct icons copied to `public/images/quick-raid/` and registered in `catalog_media`.
  - Only unambiguous icons are labeled (XP and the seven equipment scrolls). Curators must label the other 9 icons (gold-badge, gems, cookie, stones, red gem).
  - 45 range cells were coerced to spreadsheet dates in the workbook (e.g. `45112` = 5 Jul → `5-7`). They keep the raw value and are flagged `date_recovered: true` for confirmation.
  - Screen_QuickRaid, Data_Screen, and Loot_Item are UI/lookup scaffolding and stay raw-only.
- [x] Staged Workers and Estate data (`scripts/generate_estate_workbook_import.py`):
  - 29 workers with per-star (0–8☆) stats in `estate_source_workers`.
  - 13 buildings with their building stat and per-star (1–5☆) promotion stats in `estate_source_buildings`.
  - 14 building level tracks (levels 1–100: stat, production, cost per level) in `estate_source_building_levels`. Training Camp has almost no data in the workbook and no Buildings entry.
  - 3 cost tables in `estate_source_cost_tables` (worker shard costs, building level-up costs, building promotion costs). Material names are not written in the workbook (sheet is titled "Scroll, stone costs"), so labels are kept as written.
  - Workbook note: resource production excludes star upgrades and worker bonuses.
- [x] Staged Hatchery monsters (`scripts/generate_hatchery_import.py`) — historical data (Feb 2022, game 4.8.4):
  - 67 monsters in `hatchery_source_monsters`, merging the Data sheet (version, boss flag, hatch, NH timer, quests, kill cap), Zones per Monster (recommended/available zones), and Monster Training (star bonuses, 1–4 training stats with unlock notes, costs, Support unlocks over three star series).
  - 8 monsters appear only on the Training sheet (Crimson Zombie, Fat bat, Fireworm Queen, Infernal Demon, Plainswolf, Scythe Pharoah, Shark Bro, Sinister Touch). `Medusa - Boss` (Training) is matched to `Medusa-Boss` (Data).
  - Summary Table, WhereToGo, Bosses, and Monster Type are derived views/lists and stay raw-only.
- [x] Kept source-derived tables behind Admin-only RLS. Nothing new is publicly shown or used for calculations until curator review.

### 1. Complete remaining workbook normalization

Continue the repeatable import pipeline from the preserved raw source data.

1. [x] Normalize the remaining complex sources: Dragon Statues, Pets, Sigils, Glyphs, Outfits, Hatchery, Estate/Workers, and Quick Raid. (Done 2026-11-18. Still pending: the Outfit and Glyph level-up cost sheets, whose column headers are ambiguous.)
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

#### Attack formula (verified 2026-11-18)

- [x] Implemented in `src/lib/calculator/attack.ts`; reference-build test in `attack.test.ts` (`npm test`).
- Source: user-supplied calculator screenshots (`~/Downloads/calculation.png`, `calculationII.webp`, `warfrenczy.webp`), an Atreus build reproduced exactly:

  ```
  base   = trunc(Count × (1 + Attack%))          67,255 × 2.32 → 156,031
  AV     = trunc((base + Outside flat) × (1 + Outside%))   + 1,200 → 157,231
  Attack = trunc(AV × (1 + Attack multiplier))   × 1.60 → 251,569
  ```

- **Count** = all flat Attack sources (hero base/level/stars/assist, equipment, relics, dragons, sigil imprints, skins, wings, all-hero unlocks, Hero Powerup).
- **Attack%** = all percent Attack sources (altar breaks, equipment rarity unlocks, relic %, sigil imprint %, all-hero level unlocks).
- **Outside flat** = added after the percent step; in the reference build this is gem Attack (Lv.13 Tourmaline +1,200).
- **Attack multiplier** = combat buffs applied last to the whole AV. This is where sigil skill effects enter: War Frenzy's "Damage bonus +60%" is the 60% multiplier. Its imprint (+10,405 flat, +7%) is separate and lives in Count/Attack%.
- **Equipment main stat** = trunc(level value × (1 + slot-type boost + rarity boost)), e.g. 3,750 × (1 + 34.5% + 30%) → 6,168.
- War Frenzy combat effects (normal play, skill 6103304): Damage bonus +60%, Crit Damage +80%, Red Heart healing +50%, Dodge −20%, Lifesteal +50% (all applied), Weapon Melee Damage +20% (conditional). Has separate Hero Duel effects. These differ from the older Sigils workbook hidden stats (Crit Damage +50–80%, HP Recovery +30–45%, Dodge −5%), so prefer the newer values after curator review.
- The reference calculator also shows a separate **Weapon** term, `(Count + Weapon) × (1 + Attack%)`. It is supported as its own stage; in the reference build it was empty and the weapon's 6,168 sat in Count.
- "Outside flat" is part of Attack (the footer math proves it). Conditional bonuses (vs bosses, ground, melee, …) are different: they never enter Attack and only matter in combat scenarios.
- [x] HP formula in `src/lib/calculator/hp.ts`: `Max HP = trunc(Count × (1 + HP%))`, with no outside step or multiplier (Atreus base 600). The reference calculator says it is derived from Archero 8.3.0 game files and not checked against the live game. **Only the empty build is verified; needs a full HP reference build.**
- Next: a full HP reference build, the multiplier sources for other sigils and modes, and mapping each staged data table to a stage.

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
| `Archero Sigils.xlsx` | Sigil effects, evolution, hidden stats, faith | Parsed: 84 sigils, 29 "Not yet" listings, 148 faith nodes, 8 faith rules (unreviewed). `chart` sheet raw-only. |
| `Archero Glyphs.xlsx` | Glyph effects and rarity/upgrade tiers by equipment category | Parsed: 27 section base stats and 112 glyph effects (unreviewed). Level up costs sheet pending. |
| `Archero Relics.xlsx` | Relic base, advanced, exclusive, and star effects | 206 source-backed effect entries imported as unreviewed. |
| `Archero Jewels.xlsx` | Jewel levels and stat progression | 298 source-backed level effects imported as unreviewed. |
| `Archero Medals.xlsx` | Medal triggers, rarity, and enhancements | 32 source-backed entries imported as unreviewed. |
| `Archero Outfit stats.xlsx` | Outfit names, prices, bonuses, level costs, embedded art | 93 outfits and their mapped portraits imported as unreviewed; Level up Cost sheet still pending. |
| `Archero Hatchery 4.8.4 (LanderZ, mrb, Shusaku, Abstrusity, LuhCaran).xlsx` | Monster training, zones, bosses, hatchery data | Staged: 67 monsters with data, zones, and training (historical, Feb 2022). Separate from Pet and Spirit equipment. |
| `Archero Workers, Estate.xlsx` | Workers, buildings, estate levels, costs | Staged: 29 workers, 13 buildings, 14 level tracks, 3 cost tables (unreviewed). |
| `QuickRaid 5.11 (LuhCaran, Pelmens, zkn).xlsx` | Quick Raid rewards and chapters | Staged: 132 chapter reward rows with icon-keyed columns; 9 icons need curator labels. |

### Outfit workbook assets

- `Archero Outfit stats.xlsx` contains 96 embedded PNG images in `xl/media/`: 93 outfit portraits and 3 upgrade-ticket icons.
- Done: portraits are mapped from drawing anchors (portrait anchored two rows below the outfit name, in the name column of each 11-row block).
- Regenerate with `python3 scripts/generate_outfit_workbook_import.py OUTPUT.sql public/images/outfits`; the output is deterministic.

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
