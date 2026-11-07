with catalog (name, slug, image_url) as (
  values
    ('Auspicious Mistarion', 'auspicious-mistarion', '/images/dragons/auspicious-mistarion.png'),
    ('Dominus', 'dominus', '/images/dragons/dominus.png'),
    ('Ferron', 'ferron', '/images/dragons/ferron.png'),
    ('Glacion', 'glacion', '/images/dragons/glacion.png'),
    ('Infernox', 'infernox', '/images/dragons/infernox.png'),
    ('Jadeon', 'jadeon', '/images/dragons/jadeon.png'),
    ('Noxion', 'noxion', '/images/dragons/noxion.png'),
    ('Stormra', 'stormra', '/images/dragons/stormra.png'),
    ('Thunderfrost Wings', 'thunderfrost-wings', '/images/dragons/thunderfrost-wings.png'),
    ('Viridax', 'viridax', '/images/dragons/viridax.png')
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
    'dragon'::item_category,
    categories.id,
    'Catalog record imported from a supplied named icon. Historical ranking pending curation.',
    'unverified',
    true
  from catalog
  join categories on categories.slug = 'dragon'
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
