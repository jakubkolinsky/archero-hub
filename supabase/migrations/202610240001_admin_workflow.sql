create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to authenticated;

create policy "Admins can manage heroes" on heroes for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage equipment" on equipment for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage modes" on modes for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage tier lists" on tier_lists for all to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can manage rankings" on rankings for all to authenticated using (is_admin()) with check (is_admin());
