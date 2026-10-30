alter table heroes
  add column source_confidence text not null default 'community-correlated'
  check (source_confidence in ('current-official', 'historical-official', 'community-correlated'));

update heroes
set source_confidence = 'current-official'
where name in ('Zeus', 'Meowgik');

insert into heroes (name, source_url, source_version, source_confidence) values
  ('Athena', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Stella', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Raidara', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('King Arthur', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Atreus', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Phoren', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Taranis', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Helix', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Onir', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Ryan', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Shingen', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Melinda', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Taiga', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Wukong', 'https://www.apkmirror.com/apk/habby/archero/', 'recent patch notes', 'historical-official'),
  ('Ayana', 'https://archero.fandom.com/wiki/Category:Heroes', 'Fandom category', 'community-correlated'),
  ('Bonnie', 'https://archero.fandom.com/wiki/Category:Heroes', 'Fandom category', 'community-correlated'),
  ('Lina', 'https://archero.fandom.com/wiki/Category:Heroes', 'Fandom category', 'community-correlated'),
  ('Ophelia', 'https://archero.fandom.com/wiki/Category:Heroes', 'Fandom category', 'community-correlated'),
  ('Rolla', 'https://archero.fandom.com/wiki/Category:Heroes', 'Fandom category', 'community-correlated'),
  ('Shade', 'https://archero.fandom.com/wiki/Category:Heroes', 'Fandom category', 'community-correlated'),
  ('Shari', 'https://archero.fandom.com/wiki/Category:Heroes', 'Fandom category', 'community-correlated'),
  ('Sylvan', 'https://archero.fandom.com/wiki/Category:Heroes', 'Fandom category', 'community-correlated'),
  ('Urasil', 'https://archero.fandom.com/wiki/Category:Heroes', 'Fandom category', 'community-correlated'),
  ('Aquea', 'https://wiki-archero.luhcaran.fr/', 'community catalog', 'community-correlated'),
  ('Gugu', 'https://wiki-archero.luhcaran.fr/', 'community catalog', 'community-correlated'),
  ('Iris', 'https://wiki-archero.luhcaran.fr/', 'community catalog', 'community-correlated'),
  ('Blazo', 'https://wiki-archero.luhcaran.fr/', 'community catalog', 'community-correlated'),
  ('Elaine', 'https://wiki-archero.luhcaran.fr/', 'community catalog', 'community-correlated'),
  ('Bobo', 'https://wiki-archero.luhcaran.fr/', 'community catalog', 'community-correlated'),
  ('Dragon Girl', 'https://wiki-archero.luhcaran.fr/', 'community catalog', 'community-correlated')
on conflict (name) do update
  set source_url = excluded.source_url,
      source_version = excluded.source_version,
      source_confidence = excluded.source_confidence,
      active = true;
