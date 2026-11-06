alter type item_category add value if not exists 'totem';
alter type item_category add value if not exists 'skin';

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

insert into categories (name, slug) values
  ('Weapon', 'weapon'),
  ('Armor', 'armor'),
  ('Ring', 'ring'),
  ('Bracelet', 'bracelet'),
  ('Locket', 'locket'),
  ('Spellbook', 'book'),
  ('Pet', 'pet'),
  ('Dragon', 'dragon'),
  ('Hero', 'hero'),
  ('Relic', 'relic'),
  ('Glyph', 'glyph'),
  ('Rune', 'rune'),
  ('Totem', 'totem'),
  ('Skin', 'skin'),
  ('Hero Assist', 'hero_assist')
on conflict (slug) do nothing;

alter table items add column category_id uuid references categories(id);

update items
set category_id = categories.id
from categories
where categories.slug = items.category::text;

alter table items
  alter column category_id set not null,
  add constraint items_category_id_category_key unique (id, category_id);

create table rarity_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order smallint not null unique check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table item_stat_values (
  id uuid primary key default gen_random_uuid(),
  item_statistic_id uuid not null references item_statistics(id) on delete cascade,
  stat_key text not null,
  value numeric not null,
  unit text not null default 'flat' check (unit in ('flat', 'percent', 'multiplier')),
  unique (item_statistic_id, stat_key)
);

alter table item_statistics
  add column max_level integer check (max_level > 0),
  add column rarity_id uuid references rarity_levels(id) on delete set null;

create table item_abilities (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  unlock_rarity_id uuid references rarity_levels(id) on delete set null,
  unlock_rarity text,
  title text not null,
  description text not null,
  source_record_id uuid references source_records(id) on delete set null,
  created_at timestamptz not null default now(),
  check (unlock_rarity_id is not null or unlock_rarity is not null),
  unique (item_id, title, unlock_rarity)
);

create table fusion_rules (
  id uuid primary key default gen_random_uuid(),
  rarity_from_id uuid not null references rarity_levels(id) on delete restrict,
  rarity_to_id uuid not null references rarity_levels(id) on delete restrict,
  applies_to_category_id uuid references categories(id) on delete restrict,
  source_record_id uuid references source_records(id) on delete set null,
  unique (rarity_from_id, rarity_to_id, applies_to_category_id),
  check (rarity_from_id <> rarity_to_id)
);

create table fusion_rule_requirements (
  id uuid primary key default gen_random_uuid(),
  fusion_rule_id uuid not null references fusion_rules(id) on delete cascade,
  requirement_type text not null check (requirement_type in ('same_item', 'same_category', 'any_item', 'currency')),
  quantity smallint not null check (quantity > 0),
  category_id uuid references categories(id) on delete restrict,
  currency_name text,
  check (
    (requirement_type = 'same_category' and category_id is not null)
    or (requirement_type = 'currency' and currency_name is not null)
    or (requirement_type in ('same_item', 'any_item') and category_id is null and currency_name is null)
  )
);

create type dragon_type as enum ('attack', 'defense', 'balanced');

create table dragon_details (
  item_id uuid primary key references items(id) on delete cascade,
  dragon_type dragon_type not null
);

create function assert_specialized_item_category()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from items
    where items.id = new.item_id
      and items.category = tg_argv[0]::item_category
  ) then
    raise exception 'Item % must use the % category', new.item_id, tg_argv[0];
  end if;

  return new;
end;
$$;

create trigger dragon_details_require_dragon_item
before insert or update of item_id on dragon_details
for each row execute function assert_specialized_item_category('dragon');

create table dragon_skills (
  id uuid primary key default gen_random_uuid(),
  dragon_id uuid not null references dragon_details(item_id) on delete cascade,
  skill_name text not null,
  description text not null,
  unlock_level integer not null check (unlock_level > 0),
  source_record_id uuid references source_records(id) on delete set null,
  unique (dragon_id, skill_name)
);

create table relic_details (
  item_id uuid primary key references items(id) on delete cascade
);

create trigger relic_details_require_relic_item
before insert or update of item_id on relic_details
for each row execute function assert_specialized_item_category('relic');

create table relic_bonuses (
  id uuid primary key default gen_random_uuid(),
  relic_id uuid not null references relic_details(item_id) on delete cascade,
  bonus_type text not null,
  value numeric not null,
  unit text not null default 'flat' check (unit in ('flat', 'percent', 'multiplier')),
  source_record_id uuid references source_records(id) on delete set null,
  unique (relic_id, bonus_type)
);

create table user_builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mode_id uuid references modes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table user_build_slots (
  id uuid primary key default gen_random_uuid(),
  user_build_id uuid not null references user_builds(id) on delete cascade,
  slot text not null,
  item_id uuid not null references items(id) on delete restrict,
  rarity_id uuid references rarity_levels(id) on delete set null,
  item_level integer check (item_level > 0),
  unique (user_build_id, slot)
);

create index items_category_id_idx on items (category_id) where active;
create index item_statistics_rarity_id_idx on item_statistics (rarity_id);
create index item_abilities_item_idx on item_abilities (item_id);
create index fusion_rule_requirements_rule_idx on fusion_rule_requirements (fusion_rule_id);
create index dragon_skills_dragon_idx on dragon_skills (dragon_id);
create index relic_bonuses_relic_idx on relic_bonuses (relic_id);
create index user_builds_user_idx on user_builds (user_id);
create index user_build_slots_build_idx on user_build_slots (user_build_id);

alter table categories enable row level security;
alter table rarity_levels enable row level security;
alter table item_stat_values enable row level security;
alter table item_abilities enable row level security;
alter table fusion_rules enable row level security;
alter table fusion_rule_requirements enable row level security;
alter table dragon_details enable row level security;
alter table dragon_skills enable row level security;
alter table relic_details enable row level security;
alter table relic_bonuses enable row level security;
alter table user_builds enable row level security;
alter table user_build_slots enable row level security;

create policy "Public users can read categories" on categories for select using (true);
create policy "Public users can read rarity levels" on rarity_levels for select using (true);
create policy "Public users can read item stat values" on item_stat_values for select using (true);
create policy "Public users can read item abilities" on item_abilities for select using (true);
create policy "Public users can read fusion rules" on fusion_rules for select using (true);
create policy "Public users can read fusion rule requirements" on fusion_rule_requirements for select using (true);
create policy "Public users can read dragon details" on dragon_details for select using (true);
create policy "Public users can read dragon skills" on dragon_skills for select using (true);
create policy "Public users can read relic details" on relic_details for select using (true);
create policy "Public users can read relic bonuses" on relic_bonuses for select using (true);

create policy "Users can manage their builds" on user_builds for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their build slots" on user_build_slots for all to authenticated
  using (
    exists (
      select 1
      from user_builds
      where user_builds.id = user_build_slots.user_build_id
        and user_builds.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from user_builds
      where user_builds.id = user_build_slots.user_build_id
        and user_builds.user_id = (select auth.uid())
    )
  );

create policy "Admins can manage categories" on categories for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage rarity levels" on rarity_levels for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage item stat values" on item_stat_values for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage item abilities" on item_abilities for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage fusion rules" on fusion_rules for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage fusion rule requirements" on fusion_rule_requirements for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage dragon details" on dragon_details for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage dragon skills" on dragon_skills for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage relic details" on relic_details for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage relic bonuses" on relic_bonuses for all to authenticated using (is_admin()) with check (is_admin());
