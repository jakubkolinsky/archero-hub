insert into modes (name, slug)
values ('General Meta', 'general-meta')
on conflict (name) do nothing;

insert into tier_lists (title, game_version, published_at)
values ('Archero Discord Tier List', '6.10.2', '2025-03-04 00:00:00+00')
on conflict (title, game_version) do nothing;

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
    ('mini-atreus', 'B'::ranking_tier, 60)
)
insert into tier_rankings (item_id, mode_id, tier_list_id, tier, score, notes)
select
  items.id,
  modes.id,
  tier_lists.id,
  historical_rankings.tier,
  historical_rankings.score,
  'Historical community ranking from the Archero Discord Tier List 6.10.2 image (updated 2025-03-04). Score normalized by Archero Hub from tier only.'
from historical_rankings
join items on items.slug = historical_rankings.slug
join modes on modes.slug = 'general-meta'
join tier_lists on tier_lists.title = 'Archero Discord Tier List' and tier_lists.game_version = '6.10.2'
on conflict (item_id, mode_id, tier_list_id) do update
set
  tier = excluded.tier,
  score = excluded.score,
  notes = excluded.notes;
