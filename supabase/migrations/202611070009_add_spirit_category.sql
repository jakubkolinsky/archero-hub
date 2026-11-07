alter type item_category add value if not exists 'spirit';

insert into categories (name, slug)
values ('Spirit', 'spirit')
on conflict (slug) do nothing;
