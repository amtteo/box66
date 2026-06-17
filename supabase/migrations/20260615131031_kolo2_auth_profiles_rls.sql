-- Kolo 2: Auth & RBAC & tenancy
--
-- Tento súbor zrkadlí Supabase migráciu nasadenú do projektu box66
-- (verzia 20260615131031). Schéma verejných tabuliek je vlastníctvom Prismy
-- (prisma/migrations); tu žijú Supabase-špecifické objekty: trigger na
-- auth.users, FK integrita, privátne helper funkcie a RLS politiky pre Data API.

-- 1) Trigger auth.users -> public.profiles -----------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, "fullName", "avatarUrl", "phone", "createdAt", "updatedAt")
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        "updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) FK integrity: profile zrkadlí auth.users -------------------------------
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- 3) Private SECURITY DEFINER helpers (nie sú vystavené cez Data API) --------
create schema if not exists private;
grant usage on schema private to authenticated, anon, service_role;

create or replace function private.is_superadmin()
returns boolean language sql security definer set search_path = '' stable as $$
  select coalesce((select p."isSuperAdmin" from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function private.is_org_member(org uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select exists(
    select 1 from public.memberships m
    where m."profileId" = auth.uid() and m."organizationId" = org and m.status = 'ACTIVE'
  );
$$;

grant execute on function private.is_superadmin() to authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;

-- 4) RLS politiky pre Data API (rola authenticated) -------------------------
-- Ostatné tabuľky zámerne nemajú politiky: čítame ich server-side cez Prismu
-- (priame spojenie obchádza RLS), Data API k nim teda nemá prístup.

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid() or private.is_superadmin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists memberships_select_own on public.memberships;
create policy memberships_select_own on public.memberships
  for select to authenticated
  using ("profileId" = auth.uid() or private.is_superadmin());

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations
  for select to authenticated
  using (private.is_org_member(id) or private.is_superadmin());

drop policy if exists stores_select_member on public.stores;
create policy stores_select_member on public.stores
  for select to authenticated
  using (private.is_org_member("organizationId") or private.is_superadmin());
