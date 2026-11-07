update items
set
  category = 'spirit',
  category_id = categories.id,
  updated_at = now()
from categories
where categories.slug = 'spirit'
  and items.slug in (
    'bone-warrior',
    'elf',
    'flaming-ghost',
    'laser-bat',
    'living-bomb',
    'noisy-owl',
    'scythe-mage'
  );
