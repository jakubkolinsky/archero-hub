insert into tier_rankings (item_id, mode_id, tier_list_id, tier, score, notes)
select
  items.id,
  modes.id,
  tier_lists.id,
  'S'::ranking_tier,
  90,
  'Starting-point ranking curated for Archero Hub.'
from items
join modes on modes.slug = 'general-meta'
join tier_lists on tier_lists.title = 'Archero Discord Tier List' and tier_lists.game_version = '6.10.2'
where items.slug in (
  'demon-king-bracelet',
  'demon-king-grimoire',
  'demon-king-ring',
  'demon-king-spearshield',
  'demon-king-talisman',
  'demon-king-warplate'
)
on conflict (item_id, mode_id, tier_list_id) do update
set
  tier = excluded.tier,
  score = excluded.score,
  notes = excluded.notes;

delete from tier_lists
where title = 'Version 8.3.0'
  and game_version = '8.3.0';
