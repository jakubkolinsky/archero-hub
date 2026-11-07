with icon_assignments (slug, path) as (
  values
    ('wukong', '/images/heroes/wukong.png'),
    ('zeus', '/images/heroes/zeus.png'),
    ('melinda', '/images/heroes/melinda.png'),
    ('taiga', '/images/heroes/taiga.png'),
    ('stella', '/images/heroes/stella.png'),
    ('elaine', '/images/heroes/elaine.png'),
    ('bobo', '/images/heroes/bobo.png'),
    ('iris', '/images/heroes/iris.png'),
    ('blazo', '/images/heroes/blazo.png'),
    ('atreus', '/images/heroes/atreus.png'),
    ('urasil', '/images/heroes/urasil.png'),
    ('phoren', '/images/heroes/phoren.png'),
    ('magmar', '/images/dragons/magmar.png'),
    ('voideon', '/images/dragons/voideon.png'),
    ('shadex', '/images/dragons/shadex.png'),
    ('starrite', '/images/dragons/starrite.png'),
    ('geogon', '/images/dragons/geogon.png'),
    ('necrogon', '/images/dragons/necrogon.png'),
    ('swordian', '/images/dragons/swordian.png')
),
updated_items as (
  update items
  set image_url = icon_assignments.path, updated_at = now()
  from icon_assignments
  where items.slug = icon_assignments.slug
  returning items.name, items.image_url
)
insert into catalog_media (path, label)
select image_url, name
from updated_items
on conflict (path) do update
set label = excluded.label;
