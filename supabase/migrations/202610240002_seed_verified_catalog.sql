alter table heroes
  add column source_url text,
  add column source_version text;

alter table equipment
  add column source_url text,
  add column source_version text;

insert into modes (name, slug) values
  ('Chapter Push', 'chapter-push'),
  ('Kill Farming', 'kill-farming'),
  ('PvP', 'pvp'),
  ('Hero Duo', 'hero-duo'),
  ('Boss Chapters', 'boss-chapters'),
  ('Events', 'events')
on conflict (name) do nothing;

insert into tier_lists (title, game_version, published_at) values
  ('Version 8.3.0', '8.3.0', '2026-10-22 13:11:00+00')
on conflict (title, game_version) do nothing;

insert into heroes (name, source_url, source_version) values
  ('Zeus', 'https://apps.apple.com/us/app/archero/id1453651052', '8.3.0'),
  ('Meowgik', 'https://apps.apple.com/us/app/archero/id1453651052', '8.3.0')
on conflict (name) do update
  set source_url = excluded.source_url,
      source_version = excluded.source_version,
      active = true;

insert into equipment (name, type, source_url, source_version) values
  ('Expedition Fists', 'weapon', 'https://apps.apple.com/us/app/archero/id1453651052', '8.3.0'),
  ('Gale Force', 'weapon', 'https://apps.apple.com/us/app/archero/id1453651052', '8.3.0'),
  ('Brightspear', 'weapon', 'https://apps.apple.com/us/app/archero/id1453651052', '8.3.0'),
  ('Warplate', 'armor', 'https://www.apkmirror.com/apk/habby/archero/archero-8-2-0-release/', '8.2.0'),
  ('Warbracer', 'bracelet', 'https://www.apkmirror.com/apk/habby/archero/archero-8-2-0-release/', '8.2.0'),
  ('Starfire Fox', 'pet', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes'),
  ('Firebask Phoenix', 'pet', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes'),
  ('Polar Penguin King', 'pet', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes'),
  ('Bloodfeast Grail', 'relic', 'https://apps.apple.com/us/app/archero/id1453651052', '8.3.0'),
  ('Jack-o''-Lantern', 'relic', 'https://apps.apple.com/us/app/archero/id1453651052', '8.3.0'),
  ('Aegis Shield', 'relic', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes'),
  ('Angel of Judgment Statue', 'relic', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes'),
  ('Spirit Snake Gemcore', 'relic', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes'),
  ('Prosperity Band', 'relic', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes'),
  ('Penguin King Sword', 'relic', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes'),
  ('Fisher''s Gift', 'relic', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes'),
  ('Octopus Cargo Ship', 'relic', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes'),
  ('Spirit Bait Pouch', 'relic', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes'),
  ('Decadent Blade', 'relic', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes')
on conflict (name) do update
  set type = excluded.type,
      source_url = excluded.source_url,
      source_version = excluded.source_version,
      active = true;
