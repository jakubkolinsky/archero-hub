update items
set
  image_url = '/images/equipment/celestial-bracer-corrected.png',
  updated_at = now()
where slug = 'celestial-bracer';

insert into catalog_media (path, label)
values (
  '/images/equipment/celestial-bracer-corrected.png',
  'Celestial Bracer (correct orientation)'
)
on conflict (path) do update
set label = excluded.label;
