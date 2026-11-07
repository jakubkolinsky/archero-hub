with catalog (name, slug, category_slug, source_tier, tier, score) as (
  values
    ('Magmar', 'magmar', 'dragon', 'Meta', 'SS'::ranking_tier, 100),
    ('Voideon', 'voideon', 'dragon', 'Meta', 'SS'::ranking_tier, 100),
    ('Shadex', 'shadex', 'dragon', 'Meta', 'SS'::ranking_tier, 100),
    ('Starrite', 'starrite', 'dragon', 'Top', 'S'::ranking_tier, 90),
    ('Geogon', 'geogon', 'dragon', 'Top', 'S'::ranking_tier, 90),
    ('Necrogon', 'necrogon', 'dragon', 'Top', 'S'::ranking_tier, 90),
    ('Swordian', 'swordian', 'dragon', 'Top', 'S'::ranking_tier, 90),

    ('Wukong', 'wukong', 'hero', 'Top', 'S'::ranking_tier, 90),
    ('Zeus', 'zeus', 'hero', 'Top', 'S'::ranking_tier, 90),
    ('Melinda', 'melinda', 'hero', 'Top', 'S'::ranking_tier, 90),
    ('Taiga', 'taiga', 'hero', 'Top', 'S'::ranking_tier, 90),
    ('Stella', 'stella', 'hero', 'Mid', 'B'::ranking_tier, 60),
    ('Elaine', 'elaine', 'hero', 'Mid', 'B'::ranking_tier, 60),
    ('Bobo', 'bobo', 'hero', 'Mid', 'B'::ranking_tier, 60),
    ('Iris', 'iris', 'hero', 'Mid', 'B'::ranking_tier, 60),
    ('Blazo', 'blazo', 'hero', 'Mid', 'B'::ranking_tier, 60),
    ('Atreus', 'atreus', 'hero', 'Starter', 'C'::ranking_tier, 40),
    ('Urasil', 'urasil', 'hero', 'Starter', 'C'::ranking_tier, 40),
    ('Phoren', 'phoren', 'hero', 'Starter', 'C'::ranking_tier, 40)
),
upserted_items as (
  insert into items (
    name,
    slug,
    category,
    category_id,
    description,
    source_confidence,
    active
  )
  select
    catalog.name,
    catalog.slug,
    catalog.category_slug::item_category,
    categories.id,
    'Imported from the historical Archero Discord Tier List 6.10.2 board.',
    'community_historical',
    true
  from catalog
  join categories on categories.slug = catalog.category_slug
  on conflict (slug) do update
  set
    category = excluded.category,
    category_id = excluded.category_id,
    description = excluded.description,
    source_confidence = excluded.source_confidence,
    active = true,
    updated_at = now()
  returning id, slug
)
insert into tier_rankings (item_id, mode_id, tier_list_id, tier, score, notes)
select
  upserted_items.id,
  modes.id,
  tier_lists.id,
  catalog.tier,
  catalog.score,
  concat(
    'Historical community ranking from the supplied Archero Discord Tier List 6.10.2 image (updated 2025-03-04). ',
    'Original source label: ',
    catalog.source_tier,
    '.'
  )
from catalog
join upserted_items on upserted_items.slug = catalog.slug
join modes on modes.slug = 'general-meta'
join tier_lists on tier_lists.title = 'Archero Discord Tier List' and tier_lists.game_version = '6.10.2'
on conflict (item_id, mode_id, tier_list_id) do update
set
  tier = excluded.tier,
  score = excluded.score,
  notes = excluded.notes;
