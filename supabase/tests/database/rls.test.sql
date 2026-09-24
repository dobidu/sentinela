-- RLS e privilégios: deny-by-default, isolamento por município, sem escrita para staff.
begin;
create extension if not exists pgtap with schema extensions;

select plan(46);

-- ---------------------------------------------------------------------------
-- Fixtures (independentes do seed): dados em A e em B
-- ---------------------------------------------------------------------------
insert into public.municipality (id, name, ibge_code, boundary) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'Teste A', '9999901',
   extensions.st_multi(extensions.st_makeenvelope(-35.0, -8.0, -34.0, -7.0, 4326))),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'Teste B', '9999902',
   extensions.st_multi(extensions.st_makeenvelope(-40.0, -10.0, -39.0, -9.0, 4326)));

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'agent-a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'surveillance-b@test.local'),
  ('33333333-3333-4333-8333-333333333333', 'sem-profile@test.local');

insert into public.profile (id, municipality_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-00000000000a', 'agent'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-00000000000b', 'surveillance');

insert into public.report (id, municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash) values
  ('cccccccc-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-00000000000a',
   extensions.st_setsrid(extensions.st_makepoint(-34.5, -7.5), 4326), 'pneu', 'a.jpg',
   extensions.digest('token-a', 'sha256')),
  ('cccccccc-0000-4000-8000-00000000000b', 'bbbbbbbb-0000-4000-8000-00000000000b',
   extensions.st_setsrid(extensions.st_makepoint(-39.5, -9.5), 4326), 'calha', 'b.jpg',
   extensions.digest('token-b', 'sha256'));

insert into public.risk_area (id, municipality_id, geom, report_count, risk_level, window_start, window_end) values
  ('dddddddd-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-00000000000a',
   extensions.st_makeenvelope(-34.6, -7.6, -34.4, -7.4, 4326), 1, 'low', now() - interval '7 days', now()),
  ('dddddddd-0000-4000-8000-00000000000b', 'bbbbbbbb-0000-4000-8000-00000000000b',
   extensions.st_makeenvelope(-39.6, -9.6, -39.4, -9.4, 4326), 1, 'low', now() - interval '7 days', now());

insert into public.alert (municipality_id, risk_area_id, threshold_rule, channel) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'dddddddd-0000-4000-8000-00000000000a', 'r', 'email'),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'dddddddd-0000-4000-8000-00000000000b', 'r', 'email');

insert into public.inspection (municipality_id, report_id, agent_id, outcome, visited_at) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'cccccccc-0000-4000-8000-00000000000a',
   '11111111-1111-4111-8111-111111111111', 'confirmed', now());

-- ---------------------------------------------------------------------------
-- RLS habilitado em toda tabela de public (1)
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p') and not c.relrowsecurity),
  0, 'toda tabela de public tem RLS habilitado');

-- ---------------------------------------------------------------------------
-- Privilégios (5)
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'anon'),
  0, 'anon não tem privilégio em nenhuma tabela de public');

select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'authenticated' and privilege_type <> 'SELECT'),
  0, 'authenticated só tem SELECT nas tabelas de public');

select is(
  (select count(*)::int from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and (has_function_privilege('anon', p.oid, 'execute')
           or exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                       where a.grantee = 0 and a.privilege_type = 'EXECUTE'))),
  0, 'nem anon nem PUBLIC executam funções de public');

create table public.probe_future_table (id int);
select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'probe_future_table' and grantee = 'anon'),
  0, 'tabela criada depois não nasce com grant para anon (default privileges)');
select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'probe_future_table'
      and grantee = 'authenticated' and privilege_type <> 'SELECT'),
  0, 'tabela criada depois não nasce com escrita para authenticated');
drop table public.probe_future_table;

-- ---------------------------------------------------------------------------
-- anon: nenhum acesso (3)
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok($$select count(*) from public.report$$, '42501', null, 'anon não lê report');
select throws_ok($$select count(*) from public.municipality$$, '42501', null, 'anon não lê municipality');
select throws_ok(
  $$insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash)
    values ('aaaaaaaa-0000-4000-8000-00000000000a',
            extensions.st_setsrid(extensions.st_makepoint(-34.5, -7.5), 4326), 'pneu', 'x.jpg',
            extensions.digest('z', 'sha256'))$$,
  '42501', null, 'anon não insere report');
reset role;

-- ---------------------------------------------------------------------------
-- agent do município A: vê só A (7)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select results_eq($$select id from public.report$$,
  $$values ('cccccccc-0000-4000-8000-00000000000a'::uuid)$$, 'agent A vê só o report de A');
select results_eq($$select id from public.risk_area$$,
  $$values ('dddddddd-0000-4000-8000-00000000000a'::uuid)$$, 'agent A vê só a risk_area de A');
select results_eq($$select municipality_id from public.alert$$,
  $$values ('aaaaaaaa-0000-4000-8000-00000000000a'::uuid)$$, 'agent A vê só alert de A');
select is((select count(*)::int from public.inspection), 1, 'agent A vê a inspection de A');
select results_eq($$select id from public.municipality$$,
  $$values ('aaaaaaaa-0000-4000-8000-00000000000a'::uuid)$$, 'agent A vê só o próprio município');
select results_eq($$select id from public.profile$$,
  $$values ('11111111-1111-4111-8111-111111111111'::uuid)$$, 'agent A vê só o próprio profile');
select is((select count(*)::int from public.report where municipality_id = 'bbbbbbbb-0000-4000-8000-00000000000b'),
  0, 'agent A não enxerga report de B nem filtrando explicitamente');

-- ---------------------------------------------------------------------------
-- agent A: nenhuma escrita (15)
-- ---------------------------------------------------------------------------
select throws_ok(
  $$insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash)
    values ('aaaaaaaa-0000-4000-8000-00000000000a',
            extensions.st_setsrid(extensions.st_makepoint(-34.5, -7.5), 4326), 'pneu', 'x.jpg',
            extensions.digest('w', 'sha256'))$$,
  '42501', null, 'agent não insere report');
select throws_ok($$update public.report set status = 'confirmed'$$, '42501', null, 'agent não altera report');
select throws_ok($$delete from public.report$$, '42501', null, 'agent não apaga report');

select throws_ok(
  $$insert into public.risk_area (municipality_id, geom, report_count, risk_level, window_start, window_end)
    values ('aaaaaaaa-0000-4000-8000-00000000000a',
            extensions.st_makeenvelope(-34.6, -7.6, -34.4, -7.4, 4326), 1, 'low', now() - interval '1 day', now())$$,
  '42501', null, 'agent não insere risk_area');
select throws_ok($$update public.risk_area set risk_level = 'high'$$, '42501', null, 'agent não altera risk_area');
select throws_ok($$delete from public.risk_area$$, '42501', null, 'agent não apaga risk_area');

select throws_ok(
  $$insert into public.alert (municipality_id, risk_area_id, threshold_rule, channel)
    values ('aaaaaaaa-0000-4000-8000-00000000000a', 'dddddddd-0000-4000-8000-00000000000a', 'r', 'email')$$,
  '42501', null, 'agent não insere alert');
select throws_ok($$update public.alert set sent_at = now()$$, '42501', null, 'agent não altera alert');
select throws_ok($$delete from public.alert$$, '42501', null, 'agent não apaga alert');

select throws_ok(
  $$insert into public.inspection (municipality_id, report_id, agent_id, outcome, visited_at)
    values ('aaaaaaaa-0000-4000-8000-00000000000a', 'cccccccc-0000-4000-8000-00000000000a',
            '11111111-1111-4111-8111-111111111111', 'dismissed', now())$$,
  '42501', null, 'agent não insere inspection (v0.2)');
select throws_ok($$update public.inspection set notes = 'x'$$, '42501', null, 'agent não altera inspection');
select throws_ok($$delete from public.inspection$$, '42501', null, 'agent não apaga inspection');

select throws_ok(
  $$update public.profile set role = 'admin' where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501', null, 'agent não escala o próprio role');
select throws_ok(
  $$update public.profile set municipality_id = 'bbbbbbbb-0000-4000-8000-00000000000b'
     where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501', null, 'agent não troca o próprio município');
select throws_ok($$update public.municipality set name = 'x'$$, '42501', null, 'agent não altera municipality');
reset role;

-- ---------------------------------------------------------------------------
-- surveillance do município B: vê só B (4)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);

select results_eq($$select id from public.report$$,
  $$values ('cccccccc-0000-4000-8000-00000000000b'::uuid)$$, 'surveillance B vê só o report de B');
select results_eq($$select id from public.risk_area$$,
  $$values ('dddddddd-0000-4000-8000-00000000000b'::uuid)$$, 'surveillance B vê só a risk_area de B');
select results_eq($$select municipality_id from public.alert$$,
  $$values ('bbbbbbbb-0000-4000-8000-00000000000b'::uuid)$$, 'surveillance B vê só alert de B');
select is((select count(*)::int from public.inspection), 0, 'surveillance B não vê inspection de A');
reset role;

-- ---------------------------------------------------------------------------
-- autenticado sem profile: não vê nada (6)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);

select is((select count(*)::int from public.report), 0, 'sem profile: 0 report');
select is((select count(*)::int from public.risk_area), 0, 'sem profile: 0 risk_area');
select is((select count(*)::int from public.alert), 0, 'sem profile: 0 alert');
select is((select count(*)::int from public.inspection), 0, 'sem profile: 0 inspection');
select is((select count(*)::int from public.municipality), 0, 'sem profile: 0 municipality');
select is((select count(*)::int from public.profile), 0, 'sem profile: 0 profile');
reset role;

-- ---------------------------------------------------------------------------
-- helpers (5)
-- ---------------------------------------------------------------------------
select ok(has_function_privilege('authenticated', 'public.current_municipality_id()', 'execute'),
  'authenticated executa current_municipality_id');
select ok(has_function_privilege('authenticated', 'public.current_app_role()', 'execute'),
  'authenticated executa current_app_role');
select ok(not has_function_privilege('authenticated', 'public.report_enforce_boundary()', 'execute'),
  'authenticated não executa a função de trigger');
select is(
  (select p.proconfig from pg_proc p where p.oid = 'public.current_municipality_id()'::regprocedure),
  array['search_path=""'], 'current_municipality_id tem search_path fixo');
select is(
  (select p.proconfig from pg_proc p where p.oid = 'public.report_enforce_boundary()'::regprocedure),
  array['search_path=""'], 'report_enforce_boundary tem search_path fixo');

select * from finish();
rollback;
