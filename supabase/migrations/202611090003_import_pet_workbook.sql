create table pet_source_profiles (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  pet_id uuid references items(id) on delete set null,
  pet_name text not null,
  source_row_start integer not null check (source_row_start > 0),
  source_row_end integer not null check (source_row_end >= source_row_start),
  base_stats jsonb not null default '{}'::jsonb,
  level_effects jsonb not null default '[]'::jsonb,
  unlocks jsonb not null default '[]'::jsonb
);

create table pet_source_skills (
  id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references source_records(id) on delete restrict,
  pet_id uuid references items(id) on delete set null,
  pet_name text not null,
  skill_category text not null,
  skill_name text not null,
  description text not null,
  source_row_start integer not null check (source_row_start > 0),
  source_row_end integer not null check (source_row_end >= source_row_start),
  level_effects jsonb not null default '[]'::jsonb
);

alter table pet_source_profiles enable row level security;
alter table pet_source_skills enable row level security;

create policy "Admins can manage pet source profiles" on pet_source_profiles
for all to authenticated using (is_admin()) with check (is_admin());

create policy "Admins can manage pet source skills" on pet_source_skills
for all to authenticated using (is_admin()) with check (is_admin());

with source_rows (external_key, entity_type, source_fingerprint) as (
  values
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Polar Penguin King:1-7', 'pet_source_profile', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:1-7'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Polar Penguin King:9', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:9-11'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Polar Penguin King:14', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:14-16'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Polar Penguin King:19', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:19-21'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Polar Penguin King:24', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:24-26'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Empyrean Unicorn:29-35', 'pet_source_profile', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:29-35'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Empyrean Unicorn:37', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:37-39'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Empyrean Unicorn:42', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:42-44'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Empyrean Unicorn:47', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:47-49'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Empyrean Unicorn:52', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:52-54'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Verdafrost Bear:57-63', 'pet_source_profile', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:57-63'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Verdafrost Bear:65', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:65-67'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Verdafrost Bear:70', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:70-72'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Verdafrost Bear:75', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:75-77'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Verdafrost Bear:80', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:80-82'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Frothy Capy:85-91', 'pet_source_profile', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:85-91'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Frothy Capy:93', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:93-95'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Frothy Capy:98', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:98-100'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Frothy Capy:103', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:103-105'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Frothy Capy:108', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:108-110'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Furious Blitzbeak:113-119', 'pet_source_profile', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:113-119'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Furious Blitzbeak:121', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:121-123'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Furious Blitzbeak:126', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:126-128'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Furious Blitzbeak:131', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:131-133'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Furious Blitzbeak:136', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:136-138'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Ignitus Bird:141-147', 'pet_source_profile', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:141-147'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Ignitus Bird:149', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:149-151'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Ignitus Bird:154', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:154-156'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Ignitus Bird:159', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:159-161'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Ignitus Bird:164', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:164-166'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Fiery Frog:169-175', 'pet_source_profile', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:169-175'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Fiery Frog:177', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:177-179'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Fiery Frog:182', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:182-184'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Fiery Frog:187', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:187-189'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Nightstar Cat:192-198', 'pet_source_profile', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:192-198'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Nightstar Cat:200', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:200-202'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Nightstar Cat:205', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:205-207'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Nightstar Cat:210', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:210-212'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Thunderworm:215-221', 'pet_source_profile', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:215-221'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Thunderworm:223', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:223-225'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Thunderworm:228', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:228-230'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Thunderworm:233', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:233-235'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Amethyne Turtle:238-244', 'pet_source_profile', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:238-244'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Amethyne Turtle:246', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:246-248'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Amethyne Turtle:251', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:251-253'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Amethyne Turtle:256', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:256-258'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Spirit Butterfly:261-267', 'pet_source_profile', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:261-267'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Spirit Butterfly:269', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:269-271'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Spirit Butterfly:274', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:274-276'),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Spirit Butterfly:279', 'pet_source_skill', 'e7f7adda43e6d1e05b2f3526c13062974bc9689abf10dbeeb94da9e276ee675c:rows:279-281')
)
insert into source_records (catalog_source_id, external_key, entity_type, source_fingerprint)
select
  catalog_sources.id,
  source_rows.external_key,
  source_rows.entity_type,
  source_rows.source_fingerprint
from source_rows
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
on conflict (catalog_source_id, external_key, entity_type) do update
set source_fingerprint = excluded.source_fingerprint;

with profiles (
  external_key, pet_name, source_row_start, source_row_end, base_stats, level_effects, unlocks
) as (
  values
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Polar Penguin King:1-7', 'Polar Penguin King', 1, 7, '{}'::jsonb, '[{"level": "Level 20", "effect": "Max HP +850"}, {"level": "Level 40 (All Heroes)", "effect": "Max HP +950"}, {"level": "Level 60", "effect": "Attack +280"}, {"level": "Level 80 (All Heroes)", "effect": "Damage to Mobs +5%"}, {"level": "Level 100", "effect": "All Pet Health +5%"}, {"level": "Level 120 (All Heroes)", "effect": "Max HP +8%"}, {"level": "Level 140", "effect": "All pet Attack +10%"}]'::jsonb, '[{"row": 1, "effect": "Max HP +930"}, {"row": 2, "effect": "Unlock - Talent Skill: Penguin Sword"}, {"row": 3, "effect": "All Pet Attack +4%"}, {"row": 4, "effect": "Unlock - Talent Skill: Hydroglide"}, {"row": 5, "effect": "Unlock - Talent Skill: Breath of Water"}, {"row": 6, "effect": "3 random enemies will be frozen when hero enters room"}, {"row": 7, "effect": "Unlock - wnd Kindred skill slot"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Empyrean Unicorn:29-35', 'Empyrean Unicorn', 29, 35, '{"Attack": "560 (+16)", "Max HP": "2800 (+80)"}'::jsonb, '[{"level": "Level 20", "effect": "Max HP +850"}, {"level": "Level 40 (All Heroes)", "effect": "Attack +180"}, {"level": "Level 60", "effect": "Attack + 280"}, {"level": "Level 80 (All Heroes)", "effect": "Damage to Bosses + 5%"}, {"level": "Level 100", "effect": "All Pet Health +5%"}, {"level": "Level 120 (All Heroes)", "effect": "Attack +5%"}, {"level": "Level 140", "effect": "All pet Attack +10%"}]'::jsonb, '[{"row": 29, "effect": "Attack +190"}, {"row": 30, "effect": "Unlock - Talent Skill: Guardian Wings"}, {"row": 31, "effect": "All Pet Attack +4%"}, {"row": 32, "effect": "Unlock - Kindred Skill: Divine Breath"}, {"row": 33, "effect": "Unlock - Talent Skill: Recharge Boost"}, {"row": 34, "effect": "Hero fires multiple Lightning Stars at enemies when entering new room"}, {"row": 35, "effect": "Unlock - 2nd Kindred Skill Slot"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Verdafrost Bear:57-63', 'Verdafrost Bear', 57, 63, '{"Attack": "365 (+10)", "Max HP": "1820 (+52)"}'::jsonb, '[{"level": "Level 20", "effect": "Max HP +500"}, {"level": "Level 40 (All Heroes)", "effect": "Max HP +700"}, {"level": "Level 60", "effect": "Attack +180"}, {"level": "Level 80 (All Heroes)", "effect": "Melee unit''s damage reduced +3%"}, {"level": "Level 100", "effect": "All Pet Attack +3%"}, {"level": "Level 120 (All Heroes)", "effect": "Damage to Melee Units +5%"}, {"level": "Level 140", "effect": "All Pet Critical Hit Rate +5%"}]'::jsonb, '[{"row": 57, "effect": "Attack +120"}, {"row": 58, "effect": "Unlock - Talent Skill: Bearish Might"}, {"row": 59, "effect": "All Pet Attack +2%"}, {"row": 60, "effect": "Unlock - Kindred Skill: Thick ''n'' Tough"}, {"row": 61, "effect": "Unlock - Talent Skill: Ursine Rage"}, {"row": 62, "effect": "Chance to Freeze enemies when hero takes collision damage."}, {"row": 63, "effect": "Max HP +5%"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Frothy Capy:85-91', 'Frothy Capy', 85, 91, '{"Attack": "340 (+9)", "Max HP": "1940 (+58)"}'::jsonb, '[{"level": "Level 20", "effect": "Max HP +550"}, {"level": "Level 40 (All Heroes)", "effect": "Max HP +700"}, {"level": "Level 60", "effect": "Attack +180"}, {"level": "Level 80 (All Heroes)", "effect": "Projectile Resistance +3%"}, {"level": "Level 100", "effect": "All Pet HP +3%"}, {"level": "Level 120 (All Heroes)", "effect": "Damage to Ranged Units +5%"}, {"level": "Level 140", "effect": "All Pet Charge Speed +5%"}]'::jsonb, '[{"row": 85, "effect": "Attack +120"}, {"row": 86, "effect": "Unlock - Talent Skill: Steady Composure"}, {"row": 87, "effect": "All Pet Attack +3%"}, {"row": 88, "effect": "Unlock - Kindred Skill: Adversity Resurge"}, {"row": 89, "effect": "Unlock - Talent Skill: Bubbly Sauna"}, {"row": 90, "effect": "Hero releases tidal surge in four direction after being stationary for a while."}, {"row": 91, "effect": "Attack +5%"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Furious Blitzbeak:113-119', 'Furious Blitzbeak', 113, 119, '{"Attack": "420 (+11)", "Max HP": "1580 (+47)"}'::jsonb, '[{"level": "Level 20", "effect": "Max HP +550"}, {"level": "Level 40 (All Heroes)", "effect": "Attack +110"}, {"level": "Level 60", "effect": "Attack +180"}, {"level": "Level 80 (All Heroes)", "effect": "Damage to Ranged Units +3%"}, {"level": "Level 100", "effect": "All Pet Attack +3%"}, {"level": "Level 120 (All Heroes)", "effect": "Ranged units damage reduced +3%"}, {"level": "Level 140", "effect": "All Pet Battle Duration +10%"}]'::jsonb, '[{"row": 113, "effect": "Max HP +610"}, {"row": 114, "effect": "Unlock - Talent Skill: Enraged Jawk"}, {"row": 115, "effect": "All Pet Attack +3%"}, {"row": 116, "effect": "Unlock - Kindred Skill: Thundering Fury"}, {"row": 117, "effect": "Unlock - Talent Skill: Bloodthirsty Recharge"}, {"row": 118, "effect": "Hero''s Attack Speed increases after moving for a while"}, {"row": 119, "effect": "Damage to Melee Units +10%"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Ignitus Bird:141-147', 'Ignitus Bird', 141, 147, '{"Attack": "395 (+11)", "Max HP": "1690 (+47)"}'::jsonb, '[{"level": "Level 20", "effect": "Max HP +550"}, {"level": "Level 40 (All Heroes)", "effect": "Attack +110"}, {"level": "Level 60", "effect": "Attack +180"}, {"level": "Level 80 (All Heroes)", "effect": "Damage to Melee Units +3%"}, {"level": "Level 100", "effect": "All Pet HP +3%"}, {"level": "Level 120 (All Heroes)", "effect": "Collision Damage Resistance +3%"}, {"level": "Level 140", "effect": "All Pet Critical Damage +20%"}]'::jsonb, '[{"row": 141, "effect": "Max HP +610"}, {"row": 142, "effect": "Unlock - Talent Skill: Fiery Temper"}, {"row": 143, "effect": "All Pet Attack +3%"}, {"row": 144, "effect": "Unlock - Kindred Skill: Bloodletter Recharge"}, {"row": 145, "effect": "Unlock - Talent Skill: Loves the Bustle"}, {"row": 146, "effect": "Hero''s critical attacks has a chance to trigger explosions"}, {"row": 147, "effect": "Damage to Ranged Units +10%"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Fiery Frog:169-175', 'Fiery Frog', 169, 175, '{"Attack": "?", "Max HP": "?"}'::jsonb, '[{"level": "Level 20", "effect": "Max HP +350"}, {"level": "Level 40 (All Heroes)", "effect": "Max HP +400"}, {"level": "Level 60", "effect": "Attack +110"}, {"level": "Level 80 (All Heroes)", "effect": "Damage to Ranged Units +2%"}, {"level": "Level 100", "effect": "All Pet HP +2%"}, {"level": "Level 120 (All Heroes)", "effect": "Ranged Units damage reduced +2%"}, {"level": "Level 140", "effect": "Injured All Pet Charge +3%"}]'::jsonb, '[{"row": 169, "effect": "Max HP +370"}, {"row": 170, "effect": "Unlock - Talent Skill: Flame Energy"}, {"row": 171, "effect": "All Pet Attack +1%"}, {"row": 172, "effect": "Unlock - Kindred Skill: Pyromaniac"}, {"row": 173, "effect": "Attack +3%"}, {"row": 174, "effect": "Hero launches fire bomb at enemies at intervals"}, {"row": 175, "effect": "Attack +3%"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Nightstar Cat:192-198', 'Nightstar Cat', 192, 198, '{"Attack": "235 (+7)", "Max HP": "1060 (+29)"}'::jsonb, '[{"level": "Level 20", "effect": "Max HP +350"}, {"level": "Level 40 (All Heroes)", "effect": "Attack +60"}, {"level": "Level 60", "effect": "Attack +110"}, {"level": "Level 80 (All Heroes)", "effect": "Damage to Melee Units +2%"}, {"level": "Level 100", "effect": "All Pet HP +2%"}, {"level": "Level 120 (All Heroes)", "effect": "Melee unit''s damage reduced +2%"}, {"level": "Level 140", "effect": "All Pet Battle Duration +3%"}]'::jsonb, '[{"row": 192, "effect": "Max HP +370"}, {"row": 193, "effect": "Unlcok - Talent Skill: Feline Mirage"}, {"row": 194, "effect": "All Pet Attack +1%"}, {"row": 195, "effect": "Unlock - Kindred Skill: Dark Shadow"}, {"row": 196, "effect": "Damage to Bosses +5%"}, {"row": 197, "effect": "Hero fires Dark energy charges at enemies at intervals"}, {"row": 198, "effect": "Damage to Bosses +6%"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Thunderworm:215-221', 'Thunderworm', 215, 221, '{"Attack": "225 (+6)", "Max HP": "1120 (+36)"}'::jsonb, '[{"level": "Level 20", "effect": "Max HP +350"}, {"level": "Level 40 (All Heroes)", "effect": "Max HP +400"}, {"level": "Level 60", "effect": "Attack +110"}, {"level": "Level 80 (All Heroes)", "effect": "Damage to Mobs +2%"}, {"level": "Level 100", "effect": "All Pet HP +2%"}, {"level": "Level 120 (All Heroes)", "effect": "Collision Damage Resistance +2%"}, {"level": "Level 140", "effect": "All Pet Critical Hit Rate +3%"}]'::jsonb, '[{"row": 215, "effect": "Max HP +370"}, {"row": 216, "effect": "Unlock - Talent Skill: Worm Bolt"}, {"row": 217, "effect": "All Pet Attack +1%"}, {"row": 218, "effect": "Unlock - Kindred Skill: Nirvana Lightning"}, {"row": 219, "effect": "Damage to Mobs +5%"}, {"row": 220, "effect": "Hero generates lightninh that attacks enemies at intervals"}, {"row": 221, "effect": "Damage to Mobs +6%"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Amethyne Turtle:238-244', 'Amethyne Turtle', 238, 244, '{"Attack": "200 (+6)", "Max HP": "1240 (+36)"}'::jsonb, '[{"level": "Level 20", "effect": "Max HP +350"}, {"level": "Level 40 (All Heroes)", "effect": "Max HP +400"}, {"level": "Level 60", "effect": "Attack +110"}, {"level": "Level 80 (All Heroes)", "effect": "Ranged Units damage reduced +2%"}, {"level": "Level 100", "effect": "All Pet Attack +2%"}, {"level": "Level 120 (All Heroes)", "effect": "Damage to Mobs +3%"}, {"level": "Level 140", "effect": "All Pet HP +3%"}]'::jsonb, '[{"row": 238, "effect": "Attack +70"}, {"row": 239, "effect": "Unlock - Talent Skill: Run Faster"}, {"row": 240, "effect": "All Pet Attack +1%"}, {"row": 241, "effect": "Unlock - Kindred Skill: Live Longer"}, {"row": 242, "effect": "Max HP +3%"}, {"row": 243, "effect": "Hero gains 1 shield that can block shots at intervals"}, {"row": 244, "effect": "Max HP +3%"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:profile:Spirit Butterfly:261-267', 'Spirit Butterfly', 261, 267, '{"Attack": "180 (+6)", "Max HP": "1400 (+36)"}'::jsonb, '[{"level": "Level 20", "effect": "Max HP +350"}, {"level": "Level 40 (All Heroes)", "effect": "Attack +60"}, {"level": "Level 60", "effect": "Attack +110"}, {"level": "Level 80 (All Heroes)", "effect": "Melee Units damage reduced +2%"}, {"level": "Level 100", "effect": "All Pet Attack +2%"}, {"level": "Level 120 (All Heroes)", "effect": "Damage to Bosses +3%"}, {"level": "Level 140", "effect": "All Pet Attack +3%"}]'::jsonb, '[{"row": 261, "effect": "Attack +70"}, {"row": 262, "effect": "Unlock - Talent Skill: Siprit Blessing"}, {"row": 263, "effect": "All Pet Attack +1%"}, {"row": 264, "effect": "Unlock - Kindred Skill: Glacial Wings"}, {"row": 265, "effect": "Damage to Ranged Units +5%"}, {"row": 266, "effect": "Hero gains increased Movement Speed at intervals"}, {"row": 267, "effect": "Attack +3%"}]'::jsonb)
)
insert into pet_source_profiles (
  source_record_id, pet_id, pet_name, source_row_start, source_row_end, base_stats, level_effects, unlocks
)
select
  source_records.id,
  items.id,
  profiles.pet_name,
  profiles.source_row_start,
  profiles.source_row_end,
  profiles.base_stats,
  profiles.level_effects,
  profiles.unlocks
from profiles
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = profiles.external_key
  and source_records.entity_type = 'pet_source_profile'
left join items
  on lower(items.name) = lower(profiles.pet_name)
  and items.category = 'pet'
on conflict (source_record_id) do update
set
  pet_id = excluded.pet_id,
  pet_name = excluded.pet_name,
  source_row_start = excluded.source_row_start,
  source_row_end = excluded.source_row_end,
  base_stats = excluded.base_stats,
  level_effects = excluded.level_effects,
  unlocks = excluded.unlocks;

with skills (
  external_key, pet_name, skill_category, skill_name, description, source_row_start, source_row_end, level_effects
) as (
  values
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Polar Penguin King:9', 'Polar Penguin King', 'Battle Skills', 'Polar Domain', 'Polar Penguin King raises Polar Domain when it encounters bosses. Enemies within the domain lose HP over time and are inflicted with Dampen for 8(+0.5)s. Dampened enemies take extra 10% (+0.5%) damage and are frozen for longer durations.', 9, 11, '[{"level": "Level 10", "effect": "Polar Domain area increased"}, {"level": "Level 15", "effect": "Hero Movement Speed increased in Polar Domain"}, {"level": "Level 20", "effect": "When Polar Domain is active, hero gains Polar Domain effect around them"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Polar Penguin King:14', 'Polar Penguin King', 'Kindred Skill', 'Hydroglide', '-3% (+0.5%) damage taken from first attack in each room. Able to pass through water after taking damage in current room.', 14, 16, '[{"level": "Level 10", "effect": " Collision damage reduction +5%"}, {"level": "Level 15 (All Heroes)", "effect": "Attack +3%"}, {"level": "Level 20", "effect": "Gain Ice effect after taking damage in current room"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Polar Penguin King:19', 'Polar Penguin King', 'Talent Skill', 'Penguin Sword', 'When the pet is deployed, 1 Penguin Sword [Effect +5%] will appear behind the hero, lasting 8 (+0.5)s.', 19, 21, '[{"level": "Level 10", "effect": "Penguin Sword can pierce enemies"}, {"level": "Level 15", "effect": "Frozen duration increased"}, {"level": "Level 20", "effect": "Penguin Sword +1"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Polar Penguin King:24', 'Polar Penguin King', 'Talent Skill', 'Breath of Water', 'Energy recovery +10% (+2%) in rooms with water. Increases hero Attack in rooms without water.', 24, 26, '[{"level": "Level 10", "effect": "2x Attack in rooms without water"}, {"level": "Level 15", "effect": "Polar Penguin King Attack +10%"}, {"level": "Level 20", "effect": "When hero levels up in battle, Polar Penguin King gains energy"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Empyrean Unicorn:37', 'Empyrean Unicorn', 'Battle Skills', 'Divine Thunderbold', 'Fires Lightning stars that attack enemies (+5%). When cas ends, 20% chance to grant hero Bolt armor.', 37, 39, '[{"level": "Level 10", "effect": "Bolt Armor: Deals damage to nearby enemies"}, {"level": "Level 15", "effect": "Bolt Armor: Destroys nearby shots at intervals"}, {"level": "Level 20", "effect": "Stars pierce enemies and deal additional 35% damage to bosses"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Empyrean Unicorn:42', 'Empyrean Unicorn', 'Kindred Skill', 'Divine Breath', ' +1% (+0.5%) Max HP for each level up.', 42, 44, '[{"level": "Level 10 (All Heroes)", "effect": "Max HP +2%"}, {"level": "Level 15 (All Heroes)", "effect": "Attack +3%"}, {"level": "Level 20", "effect": "Attack boost in ext room on each level-up"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Empyrean Unicorn:47', 'Empyrean Unicorn', 'Talent Skill', 'Guardian Wings', 'When pet joins battle, 20% (+1%) chance to grant hero Pegasus shield that blocks shots. Lasts 6(+0.2) s.', 47, 49, '[{"level": "Level 10", "effect": "Pegasus shield +1"}, {"level": "Level 15", "effect": "Empyrean Unicorn pet HP +10%"}, {"level": "Level 20", "effect": "Turns 1 shield into Red Heart after taking damage."}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Empyrean Unicorn:52', 'Empyrean Unicorn', 'Talent Skill', 'Recharge Boost', 'Natural Recharge Speed +12% (+0.4%)', 52, 54, '[{"level": "Level 10", "effect": "Empyrean Unicorn pet Recharge Speed +3%"}, {"level": "Level 15", "effect": "Empyrean Unicorn pet Attack +10%"}, {"level": "Level 20", "effect": "Pegasus Shield speeds up recharge when blocking shots"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Verdafrost Bear:65', 'Verdafrost Bear', 'Battle Skills', 'Frostpaw Bash', 'After taking collision damage, fire a giant shockwave that attacks nearby enemies (+5%) to deal major damage and inflict freeze. 10% chance to fire again for each hit.', 65, 67, '[{"level": "Level 10", "effect": "Freeze duration extended"}, {"level": "Level 15", "effect": "Deal additional 25% damage to Bosses"}, {"level": "Level 20", "effect": "Shockwave range increased"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Verdafrost Bear:70', 'Verdafrost Bear', 'Kindred Skill', 'Thick ''n'' Tough', ' +5% (+0.2%) collision damage reduction when statonary, with effect increased over time, max 10% (+0.2%).', 70, 72, '[{"level": "Level 10 (All Heroes)", "effect": "Max HP +2%"}, {"level": "Level 15 (All Heroes)", "effect": "Damage to Melee Units +5%"}, {"level": "Level 20", "effect": " +12% additional Red Heart healing when stationary"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Verdafrost Bear:75', 'Verdafrost Bear', 'Talent Skill', 'Bearish Might', 'When pet joins battle, hero turns into a giant +20% (+0.5%) Attack and 15% Crit Chance but reduced Movement Speed. Lasta 4s.', 75, 77, '[{"level": "Level 10", "effect": "Gain damage reduction effect when transformed"}, {"level": "Level 15", "effect": "Verdafrost Bear pet HP +10%"}, {"level": "Level 20", "effect": "Movement Speed not reduced, and Dodge increased"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Verdafrost Bear:80', 'Verdafrost Bear', 'Talent Skill', 'Ursine Rage', 'For every 10% of Hero''s HP lost, Verdafrost Bear''s Crit Chance +2.5% (+0.1%)', 80, 82, '[{"level": "Level 10", "effect": "Verdafrost Bear pet Crit Chance +3%"}, {"level": "Level 15", "effect": "Verdafrost Bear pet HP +10%"}, {"level": "Level 20", "effect": "Verdafrost Bear pet Crit Damage +25%"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Frothy Capy:93', 'Frothy Capy', 'Battle Skills', 'Invincible Shield', 'Casts a giant round shield that nullifies enemy damage and increases Attack. Lasts 3 (+0.2)s. 20% (+1%) chance to restore additional HP when shield disappears.', 93, 95, '[{"level": "Level 10", "effect": "All elemental damage increased when inside shield"}, {"level": "Level 15", "effect": "No Movement Speed reduction when inside shield"}, {"level": "Level 20", "effect": "Red Hearts obtained inside shield extend shield duration"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Frothy Capy:98', 'Frothy Capy', 'Kindred Skill', 'Adversity Resurge', 'In boss rooms, when HP is reduced to 15% or lower, there is 20% (+1%) chance to restore 30% HP, up to 2 times.', 98, 100, '[{"level": "Level 10 (All Heroes)", "effect": "Max HP +2%"}, {"level": "Level 15 (All Heroes)", "effect": "Damage to Mobs +5%"}, {"level": "Level 20", "effect": "Effect now activates 3 times"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Frothy Capy:103', 'Frothy Capy', 'Talent Skill', 'Steady Composure', 'When shield disappears, it deals shockwave damage (+7%) to enemies, reducing their Attack Speed and Attack for 5s.', 103, 105, '[{"level": "Level 10", "effect": "Gain 30% damage reduction when shield ends. Lasts 3s."}, {"level": "Level 15", "effect": "Frothy Capy Pet HP +10%"}, {"level": "Level 20", "effect": "Debuff duration on bosses doubled."}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Frothy Capy:108', 'Frothy Capy', 'Talent Skill', 'Bubbly Sauna', 'The more water pools in the room, the faster the natural recharge speed. Max 15% (+1%)', 108, 110, '[{"level": "Level 10", "effect": "Frothy Capy Pet Attack +5%"}, {"level": "Level 15", "effect": "Frothy Capy Pet Attack +10%"}, {"level": "Level 20", "effect": "Rooms with water pools additionally increase natural recharge speed by 10%."}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Furious Blitzbeak:121', 'Furious Blitzbeak', 'Battle Skills', 'Thunderbolt Descent', 'Appears in battle, attacks enemies (+5%) imbued with Lightning, lasts 10 (+0.5)s.', 121, 123, '[{"level": "Level 10", "effect": "Furious Blitzbeak Attack Speed +25%"}, {"level": "Level 15", "effect": "Furious Blitzbeak Critical Chance +20%"}, {"level": "Level 20", "effect": "Shots bounce 1 time"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Furious Blitzbeak:126', 'Furious Blitzbeak', 'Kindred Skill', 'Thundering Fury', 'When HP is below 12% (+0.5%), hero attacks deal additional Lightning damage.', 126, 128, '[{"level": "Level 10 (All Heroes)", "effect": "Max HP +2%"}, {"level": "Level 15 (All Heroes)", "effect": "Damage to Ranged Units +5%"}, {"level": "Level 20", "effect": " +25% Critical damage"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Furious Blitzbeak:131', 'Furious Blitzbeak', 'Talent Skill', 'Enraging Hawk', 'When pet leaves battle, grants hero +15% (+1%) Attack Speed and +50% Lightning damage. Lasts 8 (+0.5)s.', 131, 133, '[{"level": "Level 10", "effect": "Lightning further boosted"}, {"level": "Level 15", "effect": "Furious Blitzbeak Pet HP +10%"}, {"level": "Level 20", "effect": "25% Chain Lightning damage"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Furious Blitzbeak:136', 'Furious Blitzbeak', 'Talent Skill', 'Bloodthirsty Recharge', '4% (+0.2%) chance to restore 5% of pet energy when hero defeats enemy.', 136, 138, '[{"level": "Level 10", "effect": "Furious Blitzbeak Pet Crit Damage +10%"}, {"level": "Level 15", "effect": "Furious Blitzbeak Pet Attack +10%"}, {"level": "Level 20", "effect": "Pet gains 10% recharge each time hero levels up"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Ignitus Bird:149', 'Ignitus Bird', 'Battle Skills', 'Fatal Flare', 'Releases multiple flares that deal explosive damage (+5%) with 50% (+1%) chance to split into 3 mini bombs.', 149, 151, '[{"level": "Level 10", "effect": "Mini bombs are imbued with poison"}, {"level": "Level 15", "effect": "Mini bombs can critical hit"}, {"level": "Level 20", "effect": "Flares to +25% damage to bosses"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Ignitus Bird:154', 'Ignitus Bird', 'Kindred Skill', 'Bloodletter Recharge', 'When HP is bellow 20%, all Pet Critical Chance +20% (+1%)', 154, 156, '[{"level": "Level 10 (All Heroes)", "effect": "Max HP +2%"}, {"level": "Level 15 (All Heroes)", "effect": "Damage to Bosses +5%"}, {"level": "Level 20", "effect": " +25% to all Pet Critical Damage"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Ignitus Bird:159', 'Ignitus Bird', 'Talent Skill', 'Fiery Temper', 'When pet joins battle, hero gains +30% (+1%) Critical Damage and +20% Fire Damage for 8s.', 159, 161, '[{"level": "Level 10", "effect": "Additional 35% Poison damage"}, {"level": "Level 15", "effect": "Ignitus Bird Pet HP +10%"}, {"level": "Level 20", "effect": "Effect duration is extended each time damage is taken"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Ignitus Bird:164', 'Ignitus Bird', 'Talent Skill', 'Loves the Bustle', 'For each monster present, pet damage +2.2% (+0.1%). Max 40%', 164, 166, '[{"level": "Level 10", "effect": "Ignitus Bird Pet Recharge Speed +3%"}, {"level": "Level 15", "effect": "Ignitus Bird Pet Attack +10%"}, {"level": "Level 20", "effect": "When cast with more than 10 monsters present, +25% Critical Chance"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Fiery Frog:177', 'Fiery Frog', 'Battle Skills', 'Fiery Bomb', 'Launches giant flame bomb (+5%), inflicts Fire damage on enemies and igniting a massive explosion.', 177, 179, '[{"level": "Level 10", "effect": "Fire bomb flies faster, Fire damage increased"}, {"level": "Level 15", "effect": "Fiery Frog Pet Attack +10%"}, {"level": "Level 20", "effect": "Blast radius increased, reduces enemy Movement Speed"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Fiery Frog:182', 'Fiery Frog', 'Kindred Skill', 'Pyromaniac', 'Fire damage +6% (+1%)', 182, 184, '[{"level": "Level 10 (All Heroes)", "effect": "Attack +60"}, {"level": "Level 15 (All Heroes)", "effect": "Counterattack Rate +3%"}, {"level": "Level 20", "effect": "Additionally boosts Fire Resist"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Fiery Frog:187', 'Fiery Frog', 'Talent Skill', 'Flame Energy', 'Restore 20 (+1) Energy each time hero enters the next room', 187, 189, '[{"level": "Level 10", "effect": " +50% Energy recovery in boss rooms"}, {"level": "Level 15", "effect": "Fiery Frog Pet HP +10%"}, {"level": "Level 20", "effect": "Small chance to fully restore Energy, 2x chance in boss rooms"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Nightstar Cat:200', 'Nightstar Cat', 'Battle Skills', 'Dark Energy', 'Appears in battle. Attacks enemies (+5%) that inflicts Dark damage. Lasts 6s.', 200, 202, '[{"level": "Level 10", "effect": "Shots bounce off walls twice"}, {"level": "Level 15", "effect": "Nightstar Cat Attack +10%"}, {"level": "Level 20", "effect": " +2 shots"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Nightstar Cat:205', 'Nightstar Cat', 'Kindred Skill', 'Dark Shadow', 'Hero''s Dark damage +6% (+1%)', 205, 207, '[{"level": "Level 10 (All Heroes)", "effect": "Attack +60"}, {"level": "Level 15 (All Heroes)", "effect": "Summoned Creature Damage +3%"}, {"level": "Level 20", "effect": "Dark blast radius greatly increased"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Nightstar Cat:210', 'Nightstar Cat', 'Talent Skill', 'Feline Mmirage', 'When pet joins battle, summon 2 hero mirages (+5%) that lasts 7s.', 210, 212, '[{"level": "Level 10", "effect": "Mirage attacks also fire pet shots"}, {"level": "Level 15", "effect": "Nightstar Cat Pet HP +10%"}, {"level": "Level 20", "effect": "Subsequent mirages +1 for each boss stage cleared. Max +3"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Thunderworm:223', 'Thunderworm', 'Battle Skills', 'Worm Charge', 'Charge attack on enemies (+5%) 3 times', 223, 225, '[{"level": "Level 10", "effect": "Charges +1"}, {"level": "Level 15", "effect": "Charges can deal critical hits"}, {"level": "Level 20", "effect": "Deals +25% damage to Mobs"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Thunderworm:228', 'Thunderworm', 'Kindred Skill', 'Nirvana Lightning', 'When hero is revived, +25% (+1%) Lightning damage', 228, 230, '[{"level": "Level 10 (All Heroes)", "effect": "Attack +60"}, {"level": "Level 15 (All Heroes)", "effect": "Damage to Melee Units +3%"}, {"level": "Level 20", "effect": "Additionally increases Red Heart recovery"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Thunderworm:233', 'Thunderworm', 'Talent Skill', 'Worm Bolt', 'When pet leabes battle, hero''s attacks are umbued with Lightning with +20% (+1%) Lightning damage for 8s.', 233, 235, '[{"level": "Level 10", "effect": "Additionally increases Chain Lightning damage"}, {"level": "Level 15", "effect": "Thunderworm Pet HP +10%"}, {"level": "Level 20", "effect": "Lightning evolves into Blitz Lightning"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Amethyne Turtle:246', 'Amethyne Turtle', 'Battle Skills', 'Get Behind Me', 'Summons a giant shield that blocks shots. Lasts 4 (+0.2)s, blocks up to 4 shots.', 246, 248, '[{"level": "Level 10", "effect": "Bigger Shield"}, {"level": "Level 15", "effect": "Increase own Attack for a short while for each shot blocked. Stackable."}, {"level": "Level 20", "effect": "Skills required energy -10%"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Amethyne Turtle:251', 'Amethyne Turtle', 'Kindred Skill', 'Live Longer', 'Hero gains 0.5% (+0.04%) Max HP for each level up.', 251, 253, '[{"level": "Level 10 (All Heroes)", "effect": "Attack +60"}, {"level": "Level 15 (All Heroes)", "effect": "Control Resistance +3%"}, {"level": "Level 20", "effect": "When hero reaches max level, additionally increases damage reduction slightly"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Amethyne Turtle:256', 'Amethyne Turtle', 'Talent Skill', 'Run Faster', 'When pet leaves battle, hero gains 10%(+0.5%) Movement Speed for 5s.', 256, 258, '[{"level": "Level 10", "effect": "Reduces surrounding enemies Movement Speed when leaving battle"}, {"level": "Level 15", "effect": "Amethyne Turtle Pet HP +10%"}, {"level": "Level 20", "effect": "Hero gains +10% Attack Speed"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Spirit Butterfly:269', 'Spirit Butterfly', 'Battle Skills', 'Spring Healing', 'Heals hero iver time for 3% (+0.2%) of Max HP.', 269, 271, '[{"level": "Level 10", "effect": "Each heal has a chance to heal twice the amount"}, {"level": "Level 15", "effect": "Gain slight damage reduction when healing"}, {"level": "Level 20", "effect": "When healing ends, if HP is below 20%, +25% additional Attack"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Spirit Butterfly:274', 'Spirit Butterfly', 'Kindred Skill', 'Glacial Wings', 'Hero''s Ice damage +20% (+2%)', 274, 276, '[{"level": "Level 10 (All Heroes)", "effect": "Attack +60"}, {"level": "Level 15 (All Heroes)", "effect": "HP upon Revival +3%"}, {"level": "Level 20", "effect": "Control effect duration +20%"}]'::jsonb),
    ('workbook:Archero Pets.xlsx:sheet:Pets:skill:Spirit Butterfly:279', 'Spirit Butterfly', 'Talent Skill', 'Spirit Blessing', '20% (+1%) chance to drop Red Hearts when pet leaves battle.', 279, 281, '[{"level": "Level 10", "effect": "Attack of enemies around dropped Red Hearts reduced by 10% for 5s."}, {"level": "Level 15", "effect": "Spirit Butterfly Pet HP +10%"}, {"level": "Level 20", "effect": "25% chance for 2x Red Hearts"}]'::jsonb)
)
insert into pet_source_skills (
  source_record_id, pet_id, pet_name, skill_category, skill_name, description, source_row_start, source_row_end, level_effects
)
select
  source_records.id,
  items.id,
  skills.pet_name,
  skills.skill_category,
  skills.skill_name,
  skills.description,
  skills.source_row_start,
  skills.source_row_end,
  skills.level_effects
from skills
join catalog_sources on catalog_sources.name = 'User-supplied Archero workbooks'
join source_records
  on source_records.catalog_source_id = catalog_sources.id
  and source_records.external_key = skills.external_key
  and source_records.entity_type = 'pet_source_skill'
left join items
  on lower(items.name) = lower(skills.pet_name)
  and items.category = 'pet'
on conflict (source_record_id) do update
set
  pet_id = excluded.pet_id,
  pet_name = excluded.pet_name,
  skill_category = excluded.skill_category,
  skill_name = excluded.skill_name,
  description = excluded.description,
  source_row_start = excluded.source_row_start,
  source_row_end = excluded.source_row_end,
  level_effects = excluded.level_effects;
