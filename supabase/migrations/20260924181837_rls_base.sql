-- RLS deny-by-default + higiene de privilégios.
--
-- Duas barreiras independentes:
-- 1. Privilégios: `anon` não tem nada em `public`; `authenticated` só tem SELECT.
-- 2. RLS: habilitado em todas as tabelas; policies só de leitura, restritas ao
--    município do usuário. Não há policy de escrita — cada caminho de escrita
--    entra na fase que precisar dele, com policy/RPC e teste próprios.
--
-- `service_role` (jobs e scripts) ignora RLS por design do Supabase.

-- ---------------------------------------------------------------------------
-- Privilégios
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon, authenticated, public;

revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from authenticated;
revoke all on all sequences in schema public from authenticated;

-- Objetos criados em migrations futuras (owner postgres) não nascem expostos.
-- Os default privileges de `supabase_admin` não são alteráveis daqui (postgres
-- não é membro de supabase_admin); migrations criam objetos como postgres.
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger on tables from authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
-- O EXECUTE implícito de PUBLIC só pode ser revogado no nível global.
alter default privileges for role postgres
  revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.municipality enable row level security;
alter table public.profile enable row level security;
alter table public.report enable row level security;
alter table public.risk_area enable row level security;
alter table public.alert enable row level security;
alter table public.inspection enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER: leem profile sem depender do RLS de profile)
-- Retornam NULL para usuário sem profile, o que nega todas as policies.
-- ---------------------------------------------------------------------------

create function public.current_municipality_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.municipality_id from public.profile p where p.id = auth.uid();
$$;

create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profile p where p.id = auth.uid();
$$;

revoke all on function public.current_municipality_id() from public, anon, authenticated;
revoke all on function public.current_app_role() from public, anon, authenticated;
grant execute on function public.current_municipality_id() to authenticated;
grant execute on function public.current_app_role() to authenticated;

-- ---------------------------------------------------------------------------
-- Policies (somente SELECT, somente authenticated)
-- ---------------------------------------------------------------------------

create policy municipality_select_own on public.municipality
  for select to authenticated
  using (id = (select public.current_municipality_id()));

create policy profile_select_self on public.profile
  for select to authenticated
  using (id = (select auth.uid()));

create policy report_select_same_municipality on public.report
  for select to authenticated
  using (
    municipality_id = (select public.current_municipality_id())
    and (select public.current_app_role()) is not null
  );

create policy risk_area_select_same_municipality on public.risk_area
  for select to authenticated
  using (
    municipality_id = (select public.current_municipality_id())
    and (select public.current_app_role()) is not null
  );

create policy alert_select_same_municipality on public.alert
  for select to authenticated
  using (
    municipality_id = (select public.current_municipality_id())
    and (select public.current_app_role()) is not null
  );

create policy inspection_select_same_municipality on public.inspection
  for select to authenticated
  using (
    municipality_id = (select public.current_municipality_id())
    and (select public.current_app_role()) is not null
  );
