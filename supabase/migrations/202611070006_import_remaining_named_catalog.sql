with catalog (name, slug, category_slug, image_url) as (
  values
    ('Aquea', 'aquea', 'hero', '/images/heroes/aquea.png'),
    ('Ayana', 'ayana', 'hero', '/images/heroes/ayana.png'),
    ('Bonnie', 'bonnie', 'hero', '/images/heroes/bonnie.png'),
    ('Dragon Girl', 'dragon-girl', 'hero', '/images/heroes/dragon-girl.png'),
    ('Gugu', 'gugu', 'hero', '/images/heroes/gugu.png'),
    ('Helix', 'helix', 'hero', '/images/heroes/helix.png'),
    ('King Arthur', 'king-arthur', 'hero', '/images/heroes/king-arthur.png'),
    ('Lina', 'lina', 'hero', '/images/heroes/lina.png'),
    ('Meowgik', 'meowgik', 'hero', '/images/heroes/meowgik.png'),
    ('Onir', 'onir', 'hero', '/images/heroes/onir.png'),
    ('Ophelia', 'ophelia', 'hero', '/images/heroes/ophelia.png'),
    ('Raidara', 'raidara', 'hero', '/images/heroes/raidara.png'),
    ('Rolla', 'rolla', 'hero', '/images/heroes/rolla.png'),
    ('Ryan', 'ryan', 'hero', '/images/heroes/ryan.png'),
    ('Shade', 'shade', 'hero', '/images/heroes/shade.png'),
    ('Shari', 'shari', 'hero', '/images/heroes/shari.png'),
    ('Shingen', 'shingen', 'hero', '/images/heroes/shingen.png'),
    ('Sylvan', 'sylvan', 'hero', '/images/heroes/sylvan.png'),
    ('Taranis', 'taranis', 'hero', '/images/heroes/taranis.png'),

    ('Amethyne Turtle', 'amethyne-turtle', 'pet', '/images/pets/amethyne-turtle.png'),
    ('Empyrean Unicorn', 'empyrean-unicorn', 'pet', '/images/pets/empyrean-unicorn.png'),
    ('Fiery Frog', 'fiery-frog', 'pet', '/images/pets/fiery-frog.png'),
    ('Firebask Phoenix', 'firebask-phoenix', 'pet', '/images/pets/firebask-phoenix.png'),
    ('Frothy Capy', 'frothy-capy', 'pet', '/images/pets/frothy-capy.png'),
    ('Furious Blitzbeak', 'furious-blitzbeak', 'pet', '/images/pets/furious-blitzbeak.png'),
    ('Ignitus Bird', 'ignitus-bird', 'pet', '/images/pets/ignitus-bird.png'),
    ('Mole', 'mole', 'pet', '/images/pets/mole.png'),
    ('Nightstar Cat', 'nightstar-cat', 'pet', '/images/pets/nightstar-cat.png'),
    ('Polar Penguin King', 'polar-penguin-king', 'pet', '/images/pets/polar-penguin-king.png'),
    ('Spirit Butterfly', 'spirit-butterfly', 'pet', '/images/pets/spirit-butterfly.png'),
    ('Thunderworm', 'thunderworm', 'pet', '/images/pets/thunderworm.png'),
    ('Verdafrost Bear', 'verdafrost-bear', 'pet', '/images/pets/verdafrost-bear.png'),

    ('Demon King Warplate', 'demon-king-warplate', 'armor', '/images/equipment/demon-king-warplate.png'),
    ('Demon King Grimoire', 'demon-king-grimoire', 'book', '/images/equipment/demon-king-grimoire.png'),
    ('Demon King Bracelet', 'demon-king-bracelet', 'bracelet', '/images/equipment/demon-king-bracelet.png'),
    ('Demon King Talisman', 'demon-king-talisman', 'locket', '/images/equipment/demon-king-talisman.png'),
    ('Demon King Ring', 'demon-king-ring', 'ring', '/images/equipment/demon-king-ring.png'),
    ('Demon King Spearshield', 'demon-king-spearshield', 'weapon', '/images/equipment/demon-king-spearshield.png')
),
upserted_items as (
  insert into items (
    name,
    slug,
    image_url,
    category,
    category_id,
    description,
    source_confidence,
    active
  )
  select
    catalog.name,
    catalog.slug,
    catalog.image_url,
    catalog.category_slug::item_category,
    categories.id,
    'Catalog record imported from a supplied named icon. Ranking pending curation.',
    'unverified',
    true
  from catalog
  join categories on categories.slug = catalog.category_slug
  on conflict (slug) do update
  set
    name = excluded.name,
    image_url = excluded.image_url,
    category = excluded.category,
    category_id = excluded.category_id,
    description = excluded.description,
    source_confidence = excluded.source_confidence,
    active = true,
    updated_at = now()
  returning name, image_url
)
insert into catalog_media (path, label)
select image_url, name
from upserted_items
on conflict (path) do update
set label = excluded.label;
