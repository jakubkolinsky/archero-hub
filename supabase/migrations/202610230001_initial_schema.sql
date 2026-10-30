create extension if not exists "pgcrypto";

create type equipment_type as enum ('weapon', 'armor', 'ring', 'bracelet', 'locket', 'book', 'pet', 'relic');
create type ranking_item_type as enum ('hero', 'equipment');
create type tier_rank as enum ('S+', 'S', 'A', 'B', 'C', 'D');

create table heroes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  rarity text,
  image_url text,
  release_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type equipment_type not null,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table modes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table tier_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  game_version text not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (title, game_version)
);

create table rankings (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references tier_lists(id) on delete cascade,
  mode_id uuid not null references modes(id) on delete cascade,
  item_type ranking_item_type not null,
  hero_id uuid references heroes(id) on delete cascade,
  equipment_id uuid references equipment(id) on delete cascade,
  tier tier_rank not null,
  comment text,
  created_at timestamptz not null default now(),
  check (
    (item_type = 'hero' and hero_id is not null and equipment_id is null)
    or (item_type = 'equipment' and equipment_id is not null and hero_id is null)
  )
);

create index rankings_tier_list_mode_idx on rankings (tier_list_id, mode_id);
create index equipment_type_idx on equipment (type) where active;

alter table heroes enable row level security;
alter table equipment enable row level security;
alter table modes enable row level security;
alter table tier_lists enable row level security;
alter table rankings enable row level security;

create policy "Public users can read active heroes" on heroes for select using (active);
create policy "Public users can read active equipment" on equipment for select using (active);
create policy "Public users can read modes" on modes for select using (true);
create policy "Public users can read published tier lists" on tier_lists for select using (published_at is not null);
create policy "Public users can read rankings for published tier lists" on rankings for select using (
  exists (select 1 from tier_lists where tier_lists.id = rankings.tier_list_id and tier_lists.published_at is not null)
);
