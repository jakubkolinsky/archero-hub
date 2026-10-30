create type item_category as enum (
  'weapon', 'armor', 'ring', 'pet', 'bracelet', 'locket', 'book',
  'dragon', 'relic', 'glyph', 'rune', 'hero', 'hero_assist'
);

create type ranking_tier as enum ('SS', 'S', 'A', 'B', 'C', 'D');

create table items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  image_url text,
  category item_category not null,
  rarity text,
  description text,
  release_version text,
  source_url text,
  source_confidence text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table item_statistics (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  rarity_level text not null,
  attack numeric,
  hp numeric,
  crit_rate numeric,
  crit_damage numeric,
  damage_bonus numeric,
  attack_speed numeric,
  movement_speed numeric,
  special_effect text,
  unique (item_id, rarity_level)
);

create table tier_rankings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  mode_id uuid not null references modes(id) on delete cascade,
  tier ranking_tier not null,
  score smallint not null check (score between 0 and 100),
  notes text,
  tier_list_id uuid not null references tier_lists(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (item_id, mode_id, tier_list_id)
);

create table builds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  hero_id uuid references items(id) on delete set null,
  mode_id uuid references modes(id) on delete set null,
  build_score smallint check (build_score between 0 and 100),
  strengths text,
  weaknesses text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table build_slots (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  slot text not null,
  item_id uuid not null references items(id) on delete restrict,
  unique (build_id, slot)
);

create index items_category_idx on items (category) where active;
create index tier_rankings_lookup_idx on tier_rankings (tier_list_id, mode_id, item_id);
create index build_slots_build_idx on build_slots (build_id);

alter table items enable row level security;
alter table item_statistics enable row level security;
alter table tier_rankings enable row level security;
alter table builds enable row level security;
alter table build_slots enable row level security;

create policy "Public users can read active items" on items for select using (active);
create policy "Public users can read item statistics" on item_statistics for select using (true);
create policy "Public users can read rankings for published tier lists" on tier_rankings for select using (
  exists (select 1 from tier_lists where tier_lists.id = tier_rankings.tier_list_id and tier_lists.published_at is not null)
);
create policy "Public users can read active builds" on builds for select using (active);
create policy "Public users can read slots for active builds" on build_slots for select using (
  exists (select 1 from builds where builds.id = build_slots.build_id and builds.active)
);

create policy "Admins can manage items" on items for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage item statistics" on item_statistics for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage tier rankings" on tier_rankings for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage builds" on builds for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage build slots" on build_slots for all to authenticated using (is_admin()) with check (is_admin());
