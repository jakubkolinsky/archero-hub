create type catalog_source_status as enum ('current', 'legacy_reference', 'deprecated');
create type source_record_status as enum ('unreviewed', 'verified', 'rejected');

create table catalog_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  source_url text not null unique,
  license_url text,
  source_version text,
  content_current_through date,
  status catalog_source_status not null,
  attribution text not null,
  created_at timestamptz not null default now()
);

create table source_records (
  id uuid primary key default gen_random_uuid(),
  catalog_source_id uuid not null references catalog_sources(id) on delete cascade,
  external_key text not null,
  entity_type text not null,
  source_fingerprint text,
  review_status source_record_status not null default 'unreviewed',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (catalog_source_id, external_key, entity_type)
);

alter table items
  add column catalog_source_id uuid references catalog_sources(id) on delete set null,
  add column source_record_id uuid references source_records(id) on delete set null;

alter table item_statistics
  add column source_record_id uuid references source_records(id) on delete set null;

create table calculator_rule_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  game_version text not null,
  catalog_source_id uuid references catalog_sources(id) on delete set null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (name, game_version)
);

create table calculator_rules (
  id uuid primary key default gen_random_uuid(),
  rule_set_id uuid not null references calculator_rule_sets(id) on delete cascade,
  rule_key text not null,
  inputs jsonb not null default '{}'::jsonb,
  effects jsonb not null default '{}'::jsonb,
  notes text,
  source_record_id uuid references source_records(id) on delete set null,
  unique (rule_set_id, rule_key)
);

create index source_records_catalog_source_idx on source_records (catalog_source_id, entity_type);
create index calculator_rules_rule_set_idx on calculator_rules (rule_set_id);

alter table catalog_sources enable row level security;
alter table source_records enable row level security;
alter table calculator_rule_sets enable row level security;
alter table calculator_rules enable row level security;

create policy "Public users can read catalog sources" on catalog_sources for select using (true);
create policy "Public users can read verified source records" on source_records for select using (review_status = 'verified');
create policy "Public users can read active calculator rule sets" on calculator_rule_sets for select using (active);
create policy "Public users can read active calculator rules" on calculator_rules for select using (
  exists (select 1 from calculator_rule_sets where calculator_rule_sets.id = calculator_rules.rule_set_id and calculator_rule_sets.active)
);

create policy "Admins can manage catalog sources" on catalog_sources for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage source records" on source_records for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage calculator rule sets" on calculator_rule_sets for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage calculator rules" on calculator_rules for all to authenticated using (is_admin()) with check (is_admin());

insert into catalog_sources (
  name,
  source_url,
  license_url,
  source_version,
  content_current_through,
  status,
  attribution
) values (
  'LuhCaran Archero Wiki',
  'https://wiki-archero.luhcaran.fr/en/',
  'https://github.com/enzo405/public-archero-wiki-docker/blob/master/LICENSE',
  '2.2.0a',
  '2024-01-16',
  'legacy_reference',
  'Historical mechanics reference. Do not copy descriptions or image assets; retain attribution for independently verified facts.'
);
