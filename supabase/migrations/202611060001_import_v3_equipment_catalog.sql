alter table items
  add column import_key text unique,
  add column set_name text,
  add column grade_type text;

insert into rarity_levels (name, sort_order) values
  ('Normal', 0),
  ('Rare', 1),
  ('Epic', 2),
  ('Perfect Epic', 3),
  ('Legendary', 4),
  ('Ancient Legendary', 5),
  ('Mythic', 6),
  ('Titan', 7),
  ('Chaos', 8)
on conflict (name) do nothing;

with catalog (import_key, name, slug, category_slug, set_name, grade_type) as (
  values
    ('W1', 'Brave Bow', 'brave-bow', 'weapon', 'Classic', 'Normal'),
    ('W2', 'Saw Blade', 'saw-blade', 'weapon', 'Classic', 'Normal'),
    ('W3', 'Tornado', 'tornado', 'weapon', 'Classic', 'Normal'),
    ('W4', 'Death Scythe', 'death-scythe', 'weapon', 'Classic', 'Normal'),
    ('W5', 'Brightspear', 'brightspear', 'weapon', 'Classic', 'Normal'),
    ('W6', 'Stalker Staff', 'stalker-staff', 'weapon', 'Classic', 'Normal'),
    ('W7', 'Gale Force', 'gale-force', 'weapon', 'Classic', 'Normal'),
    ('W8', 'Demon Blade Rain', 'demon-blade-rain', 'weapon', 'Classic', 'Normal'),
    ('W9', 'Antiquated Sword', 'antiquated-sword', 'weapon', 'Classic', 'Normal'),
    ('W10', 'Mini Atreus', 'mini-atreus', 'weapon', 'Classic', 'Normal'),
    ('W11', 'Expedition Fist', 'expedition-fist', 'weapon', 'Expedition', 'S'),
    ('W12', 'Celestial Might', 'celestial-might', 'weapon', 'Celestial', 'SS'),
    ('A1', 'Vest of Dexterity', 'vest-of-dexterity', 'armor', 'Classic', 'Normal'),
    ('A2', 'Phantom Cloak', 'phantom-cloak', 'armor', 'Classic', 'Normal'),
    ('A3', 'Golden Chestplate', 'golden-chestplate', 'armor', 'Classic', 'Normal'),
    ('A4', 'Void Robe', 'void-robe', 'armor', 'Classic', 'Normal'),
    ('A5', 'Bright Robe', 'bright-robe', 'armor', 'Classic', 'Normal'),
    ('A6', 'Shadow Robe', 'shadow-robe', 'armor', 'Classic', 'Normal'),
    ('A7', 'Expedition Plate', 'expedition-plate', 'armor', 'Expedition', 'S'),
    ('A8', 'Celestial Warplate', 'celestial-warplate', 'armor', 'Celestial', 'SS'),
    ('R1', 'Bear Ring', 'bear-ring', 'ring', 'Classic', 'Normal'),
    ('R2', 'Wolf Ring', 'wolf-ring', 'ring', 'Classic', 'Normal'),
    ('R3', 'Falcon Ring', 'falcon-ring', 'ring', 'Classic', 'Normal'),
    ('R4', 'Serpent Ring', 'serpent-ring', 'ring', 'Classic', 'Normal'),
    ('R5', 'Bull Ring', 'bull-ring', 'ring', 'Classic', 'Normal'),
    ('R6', 'Lion Ring', 'lion-ring', 'ring', 'Classic', 'Normal'),
    ('R7', 'Dragon Ring', 'dragon-ring', 'ring', 'Classic', 'Normal'),
    ('R8', 'Vilebat Ring', 'vilebat-ring', 'ring', 'Classic', 'Normal'),
    ('R9', 'Expedition Ring', 'expedition-ring', 'ring', 'Expedition', 'S'),
    ('R10', 'Celestial Band', 'celestial-band', 'ring', 'Celestial', 'SS'),
    ('P1', 'Laser Bat', 'laser-bat', 'pet', 'Classic', 'Normal'),
    ('P2', 'Scythe Mage', 'scythe-mage', 'pet', 'Classic', 'Normal'),
    ('P3', 'Elf', 'elf', 'pet', 'Classic', 'Normal'),
    ('P4', 'Bone Warrior', 'bone-warrior', 'pet', 'Classic', 'Normal'),
    ('P5', 'Living Bomb', 'living-bomb', 'pet', 'Classic', 'Normal'),
    ('P6', 'Noisy Owl', 'noisy-owl', 'pet', 'Classic', 'Normal'),
    ('P7', 'Flaming Ghost', 'flaming-ghost', 'pet', 'Classic', 'Normal'),
    ('B1', 'Thunder Bracelet', 'thunder-bracelet', 'bracelet', 'Classic', 'Normal'),
    ('B2', 'Frozen Bracelet', 'frozen-bracelet', 'bracelet', 'Classic', 'Normal'),
    ('B3', 'Blazing Bracelet', 'blazing-bracelet', 'bracelet', 'Classic', 'Normal'),
    ('B4', 'Split Bracelet', 'split-bracelet', 'bracelet', 'Classic', 'Normal'),
    ('B5', 'Invincible Bracelet', 'invincible-bracelet', 'bracelet', 'Classic', 'Normal'),
    ('B6', 'Quickshot Bracelet', 'quickshot-bracelet', 'bracelet', 'Classic', 'Normal'),
    ('B7', 'Shield Bracelet', 'shield-bracelet', 'bracelet', 'Classic', 'Normal'),
    ('B8', 'Expedition Bracelet', 'expedition-bracelet', 'bracelet', 'Expedition', 'S'),
    ('B9', 'Celestial Bracer', 'celestial-bracer', 'bracelet', 'Celestial', 'SS'),
    ('L1', 'Agile Locket', 'agile-locket', 'locket', 'Classic', 'Normal'),
    ('L2', 'Iron Locket', 'iron-locket', 'locket', 'Classic', 'Normal'),
    ('L3', 'Angel Locket', 'angel-locket', 'locket', 'Classic', 'Normal'),
    ('L4', 'Bulletproof Locket', 'bulletproof-locket', 'locket', 'Classic', 'Normal'),
    ('L5', 'Bloodthirsty Locket', 'bloodthirsty-locket', 'locket', 'Classic', 'Normal'),
    ('L6', 'Piercer Locket', 'piercer-locket', 'locket', 'Classic', 'Normal'),
    ('L7', 'Counterattack Charm', 'counterattack-charm', 'locket', 'Classic', 'Normal'),
    ('L8', 'Expedition Locket', 'expedition-locket', 'locket', 'Expedition', 'S'),
    ('L9', 'Celestial Talisman', 'celestial-talisman', 'locket', 'Celestial', 'SS'),
    ('SP1', 'Arcane Archer', 'arcane-archer', 'book', 'Classic', 'Normal'),
    ('SP2', 'Art of Combat', 'art-of-combat', 'book', 'Classic', 'Normal'),
    ('SP3', 'Ice Realm', 'ice-realm', 'book', 'Classic', 'Normal'),
    ('SP4', 'Enlightenment', 'enlightenment', 'book', 'Classic', 'Normal'),
    ('SP5', 'Giants Contract', 'giants-contract', 'book', 'Classic', 'Normal'),
    ('SP6', 'Spectre Book', 'spectre-book', 'book', 'Classic', 'Normal'),
    ('SP7', 'Arcanum of Time', 'arcanum-of-time', 'book', 'Classic', 'Normal'),
    ('SP8', 'Expedition Spellbook', 'expedition-spellbook', 'book', 'Expedition', 'S'),
    ('SP9', 'Celestial Codex', 'celestial-codex', 'book', 'Celestial', 'SS')
)
insert into items (
  import_key,
  name,
  slug,
  image_url,
  category,
  category_id,
  rarity,
  set_name,
  grade_type,
  source_confidence,
  active
)
select
  catalog.import_key,
  catalog.name,
  catalog.slug,
  concat('/images/equipment/', catalog.slug, '.png'),
  catalog.category_slug::item_category,
  categories.id,
  catalog.grade_type,
  catalog.set_name,
  catalog.grade_type,
  'unverified',
  true
from catalog
join categories on categories.slug = catalog.category_slug
on conflict (slug) do update
set
  import_key = excluded.import_key,
  image_url = excluded.image_url,
  category = excluded.category,
  category_id = excluded.category_id,
  rarity = excluded.rarity,
  set_name = excluded.set_name,
  grade_type = excluded.grade_type,
  source_confidence = excluded.source_confidence,
  active = true,
  updated_at = now();

with abilities (item_slug, rarity_name, title) as (
  values
    ('expedition-fist', 'Epic', 'Power Punch / Combo speed bonus'),
    ('expedition-fist', 'Perfect Epic', 'Projectile dodge while moving'),
    ('expedition-fist', 'Legendary', 'Higher crit on melee hit'),
    ('expedition-fist', 'Ancient Legendary', 'Attack +15%'),
    ('expedition-fist', 'Mythic', 'Lower HP increases attack'),
    ('celestial-might', 'Epic', 'Hammer and Lightning forms'),
    ('celestial-might', 'Perfect Epic', 'Projectile speed scaling'),
    ('celestial-might', 'Legendary', 'Stormsmash damage scaling'),
    ('celestial-might', 'Ancient Legendary', 'Holy Touch interactions'),
    ('celestial-might', 'Mythic', 'Attack increases after damage taken')
)
insert into item_abilities (
  item_id,
  unlock_rarity_id,
  unlock_rarity,
  title,
  description
)
select
  items.id,
  rarity_levels.id,
  abilities.rarity_name,
  abilities.title,
  'Imported from the v3 workbook; verify in game before publishing.'
from abilities
join items on items.slug = abilities.item_slug
join rarity_levels on rarity_levels.name = abilities.rarity_name
on conflict (item_id, title, unlock_rarity) do update
set
  unlock_rarity_id = excluded.unlock_rarity_id,
  description = excluded.description;
