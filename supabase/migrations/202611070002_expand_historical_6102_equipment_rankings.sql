with historical_rankings (slug, tier, score) as (
  values
    ('stalker-staff', 'SS'::ranking_tier, 100),
    ('expedition-fist', 'SS'::ranking_tier, 100),
    ('celestial-might', 'SS'::ranking_tier, 100),
    ('antiquated-sword', 'A'::ranking_tier, 80),
    ('demon-blade-rain', 'A'::ranking_tier, 80),
    ('brightspear', 'B'::ranking_tier, 60),
    ('death-scythe', 'B'::ranking_tier, 60),
    ('brave-bow', 'B'::ranking_tier, 60),
    ('saw-blade', 'B'::ranking_tier, 60),
    ('gale-force', 'B'::ranking_tier, 60),
    ('tornado', 'B'::ranking_tier, 60),
    ('mini-atreus', 'B'::ranking_tier, 60),

    ('golden-chestplate', 'S'::ranking_tier, 90),
    ('celestial-warplate', 'S'::ranking_tier, 90),
    ('vest-of-dexterity', 'A'::ranking_tier, 80),
    ('bright-robe', 'A'::ranking_tier, 80),
    ('expedition-plate', 'A'::ranking_tier, 80),
    ('shadow-robe', 'B'::ranking_tier, 60),
    ('phantom-cloak', 'B'::ranking_tier, 60),
    ('void-robe', 'C'::ranking_tier, 40),

    ('dragon-ring', 'S'::ranking_tier, 90),
    ('celestial-band', 'S'::ranking_tier, 90),
    ('vilebat-ring', 'A'::ranking_tier, 80),
    ('bull-ring', 'A'::ranking_tier, 80),
    ('lion-ring', 'A'::ranking_tier, 80),
    ('falcon-ring', 'B'::ranking_tier, 60),
    ('wolf-ring', 'B'::ranking_tier, 60),
    ('expedition-ring', 'B'::ranking_tier, 60),
    ('serpent-ring', 'C'::ranking_tier, 40),
    ('bear-ring', 'C'::ranking_tier, 40),

    ('bone-warrior', 'A'::ranking_tier, 80),
    ('flaming-ghost', 'A'::ranking_tier, 80),
    ('living-bomb', 'B'::ranking_tier, 60),
    ('laser-bat', 'B'::ranking_tier, 60),
    ('scythe-mage', 'C'::ranking_tier, 40),
    ('elf', 'C'::ranking_tier, 40),
    ('noisy-owl', 'C'::ranking_tier, 40),

    ('ice-realm', 'S'::ranking_tier, 90),
    ('arcanum-of-time', 'S'::ranking_tier, 90),
    ('expedition-spellbook', 'A'::ranking_tier, 80),
    ('arcane-archer', 'A'::ranking_tier, 80),
    ('art-of-combat', 'A'::ranking_tier, 80),
    ('celestial-codex', 'B'::ranking_tier, 60),
    ('spectre-book', 'B'::ranking_tier, 60),
    ('giants-contract', 'C'::ranking_tier, 40),
    ('enlightenment', 'C'::ranking_tier, 40),

    ('celestial-bracer', 'S'::ranking_tier, 90),
    ('expedition-bracelet', 'S'::ranking_tier, 90),
    ('shield-bracelet', 'A'::ranking_tier, 80),
    ('invincible-bracelet', 'A'::ranking_tier, 80),
    ('quickshot-bracelet', 'B'::ranking_tier, 60),
    ('frozen-bracelet', 'B'::ranking_tier, 60),
    ('split-bracelet', 'C'::ranking_tier, 40),
    ('blazing-bracelet', 'C'::ranking_tier, 40),
    ('thunder-bracelet', 'C'::ranking_tier, 40),

    ('celestial-talisman', 'S'::ranking_tier, 90),
    ('counterattack-charm', 'S'::ranking_tier, 90),
    ('bulletproof-locket', 'A'::ranking_tier, 80),
    ('expedition-locket', 'A'::ranking_tier, 80),
    ('piercer-locket', 'A'::ranking_tier, 80),
    ('agile-locket', 'B'::ranking_tier, 60),
    ('angel-locket', 'C'::ranking_tier, 40),
    ('iron-locket', 'C'::ranking_tier, 40),
    ('bloodthirsty-locket', 'C'::ranking_tier, 40)
)
insert into tier_rankings (item_id, mode_id, tier_list_id, tier, score, notes)
select
  items.id,
  modes.id,
  tier_lists.id,
  historical_rankings.tier,
  historical_rankings.score,
  'Historical community ranking from the supplied Archero Discord Tier List 6.10.2 image (updated 2025-03-04). Icon mapping is curator-adjustable for older artwork variants.'
from historical_rankings
join items on items.slug = historical_rankings.slug
join modes on modes.slug = 'general-meta'
join tier_lists on tier_lists.title = 'Archero Discord Tier List' and tier_lists.game_version = '6.10.2'
on conflict (item_id, mode_id, tier_list_id) do update
set
  tier = excluded.tier,
  score = excluded.score,
  notes = excluded.notes;
