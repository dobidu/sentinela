-- Schema: tabelas, tipos espaciais, tenancy, enums, integridade espacial e trilha.
begin;
create extension if not exists pgtap with schema extensions;

select plan(41);

-- ---------------------------------------------------------------------------
-- Fixtures (independentes do seed)
-- ---------------------------------------------------------------------------
insert into public.municipality (id, name, ibge_code, boundary) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'Teste A', '9999901',
   extensions.st_multi(extensions.st_makeenvelope(-35.0, -8.0, -34.0, -7.0, 4326))),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'Teste B', '9999902',
   extensions.st_multi(extensions.st_makeenvelope(-40.0, -10.0, -39.0, -9.0, 4326)));

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'agent-a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'agent-b@test.local');

insert into public.profile (id, municipality_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-00000000000a', 'agent'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-00000000000b', 'agent');

insert into public.report (id, municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash) values
  ('cccccccc-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-00000000000a',
   extensions.st_setsrid(extensions.st_makepoint(-34.5, -7.5), 4326), 'pneu', 'a.jpg',
   extensions.digest('token-a', 'sha256'));

insert into public.risk_area (id, municipality_id, geom, report_count, risk_level, window_start, window_end) values
  ('dddddddd-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-00000000000a',
   extensions.st_makeenvelope(-34.6, -7.6, -34.4, -7.4, 4326), 1, 'low',
   now() - interval '7 days', now());

-- ---------------------------------------------------------------------------
-- Tabelas (6)
-- ---------------------------------------------------------------------------
select has_table('public', 'municipality', 'tabela municipality existe');
select has_table('public', 'profile', 'tabela profile existe');
select has_table('public', 'report', 'tabela report existe');
select has_table('public', 'risk_area', 'tabela risk_area existe');
select has_table('public', 'alert', 'tabela alert existe');
select has_table('public', 'inspection', 'tabela inspection existe');

-- ---------------------------------------------------------------------------
-- Geometrias com SRID 4326 (3) e índices GiST (3)
-- ---------------------------------------------------------------------------
select col_type_is('public', 'report', 'geom', 'extensions', 'geometry(Point,4326)', 'report.geom é Point 4326');
select col_type_is('public', 'risk_area', 'geom', 'extensions', 'geometry(Polygon,4326)', 'risk_area.geom é Polygon 4326');
select col_type_is('public', 'municipality', 'boundary', 'extensions', 'geometry(MultiPolygon,4326)', 'municipality.boundary é MultiPolygon 4326');

select has_index('public', 'report', 'report_geom_gix', 'GiST em report.geom');
select has_index('public', 'risk_area', 'risk_area_geom_gix', 'GiST em risk_area.geom');
select has_index('public', 'municipality', 'municipality_boundary_gix', 'GiST em municipality.boundary');

-- ---------------------------------------------------------------------------
-- Tenancy: municipality_id NOT NULL (5)
-- ---------------------------------------------------------------------------
select col_not_null('public', 'profile', 'municipality_id', 'profile.municipality_id not null');
select col_not_null('public', 'report', 'municipality_id', 'report.municipality_id not null');
select col_not_null('public', 'risk_area', 'municipality_id', 'risk_area.municipality_id not null');
select col_not_null('public', 'alert', 'municipality_id', 'alert.municipality_id not null');
select col_not_null('public', 'inspection', 'municipality_id', 'inspection.municipality_id not null');

-- ---------------------------------------------------------------------------
-- Enums (5)
-- ---------------------------------------------------------------------------
select enum_has_labels('public', 'app_role', array['agent', 'surveillance', 'admin'], 'app_role');
select enum_has_labels('public', 'report_status', array['pending', 'confirmed', 'dismissed', 'resolved'], 'report_status');
select enum_has_labels('public', 'breeding_site_type',
  array['pneu', 'caixa_dagua', 'vaso_planta', 'lixo_entulho', 'calha', 'piscina', 'recipiente_diverso', 'outro'],
  'breeding_site_type');
select enum_has_labels('public', 'risk_level', array['low', 'medium', 'high'], 'risk_level');
select enum_has_labels('public', 'inspection_outcome', array['confirmed', 'dismissed', 'resolved', 'not_found'], 'inspection_outcome');

-- ---------------------------------------------------------------------------
-- Minimização LGPD no report (4)
-- ---------------------------------------------------------------------------
select hasnt_column('public', 'report', 'reporter_token', 'report não guarda token em claro');
select hasnt_column('public', 'report', 'photo_url', 'report não persiste URL de foto');
select col_type_is('public', 'report', 'reporter_token_hash', 'bytea', 'reporter_token_hash é bytea');
select throws_ok(
  $$insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash)
    values ('aaaaaaaa-0000-4000-8000-00000000000a',
            extensions.st_setsrid(extensions.st_makepoint(-34.5, -7.5), 4326), 'pneu', 'x.jpg',
            '\x00'::bytea)$$,
  '23514', null, 'hash com tamanho diferente de 32 bytes é rejeitado');

-- ---------------------------------------------------------------------------
-- Integridade espacial (5)
-- ---------------------------------------------------------------------------
select lives_ok(
  $$insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash)
    values ('aaaaaaaa-0000-4000-8000-00000000000a',
            extensions.st_setsrid(extensions.st_makepoint(-34.2, -7.2), 4326), 'calha', 'x.jpg',
            extensions.digest('t1', 'sha256'))$$,
  'ponto dentro do limite é aceito');

select throws_ok(
  $$insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash)
    values ('aaaaaaaa-0000-4000-8000-00000000000a',
            extensions.st_setsrid(extensions.st_makepoint(-39.5, -9.5), 4326), 'pneu', 'x.jpg',
            extensions.digest('t2', 'sha256'))$$,
  '23514', null, 'ponto fora do limite do município é rejeitado');

select throws_ok(
  $$insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash)
    values ('aaaaaaaa-0000-4000-8000-00000000000a',
            extensions.st_setsrid(extensions.st_makepoint(-34.5, -7.5), 4674), 'pneu', 'x.jpg',
            extensions.digest('t3', 'sha256'))$$,
  '22023', null, 'SRID diferente de 4326 é rejeitado');

select throws_ok(
  $$insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash)
    values ('eeeeeeee-0000-4000-8000-000000000000',
            extensions.st_setsrid(extensions.st_makepoint(-34.5, -7.5), 4326), 'pneu', 'x.jpg',
            extensions.digest('t4', 'sha256'))$$,
  '23503', null, 'município inexistente é rejeitado (fail-closed)');

select throws_ok(
  $$update public.report set geom = extensions.st_setsrid(extensions.st_makepoint(-39.5, -9.5), 4326)
     where id = 'cccccccc-0000-4000-8000-00000000000a'$$,
  '23514', null, 'update que move o ponto para fora do limite é rejeitado');

-- ---------------------------------------------------------------------------
-- Trigger independe da visibilidade de municipality do role que insere (2)
-- ---------------------------------------------------------------------------
create role probe_inserter nologin;
grant probe_inserter to postgres;
grant usage on schema public, extensions to probe_inserter;
grant insert on public.report to probe_inserter;
create policy probe_insert on public.report for insert to probe_inserter with check (true);

set local role probe_inserter;
select lives_ok(
  $$insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash)
    values ('aaaaaaaa-0000-4000-8000-00000000000a',
            extensions.st_setsrid(extensions.st_makepoint(-34.3, -7.3), 4326), 'pneu', 'x.jpg',
            extensions.digest('t5', 'sha256'))$$,
  'role sem SELECT em municipality insere ponto válido (trigger SECURITY DEFINER)');
select throws_ok(
  $$insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash)
    values ('aaaaaaaa-0000-4000-8000-00000000000a',
            extensions.st_setsrid(extensions.st_makepoint(-39.5, -9.5), 4326), 'pneu', 'x.jpg',
            extensions.digest('t6', 'sha256'))$$,
  '23514', null, 'role sem SELECT em municipality não consegue inserir ponto fora (fail-closed)');
reset role;

-- ---------------------------------------------------------------------------
-- Tenancy por FK composta (4)
-- ---------------------------------------------------------------------------
select throws_ok(
  $$insert into public.inspection (municipality_id, report_id, agent_id, outcome, visited_at)
    values ('bbbbbbbb-0000-4000-8000-00000000000b', 'cccccccc-0000-4000-8000-00000000000a',
            '22222222-2222-4222-8222-222222222222', 'confirmed', now())$$,
  '23503', null, 'inspection com municipality diferente do report é rejeitada');

select throws_ok(
  $$insert into public.inspection (municipality_id, report_id, agent_id, outcome, visited_at)
    values ('aaaaaaaa-0000-4000-8000-00000000000a', 'cccccccc-0000-4000-8000-00000000000a',
            '22222222-2222-4222-8222-222222222222', 'confirmed', now())$$,
  '23503', null, 'inspection com agent de outro município é rejeitada');

select throws_ok(
  $$insert into public.alert (municipality_id, risk_area_id, threshold_rule, channel, acknowledged_at, acknowledged_by)
    values ('aaaaaaaa-0000-4000-8000-00000000000a', 'dddddddd-0000-4000-8000-00000000000a',
            'density>=1/7d', 'email', now(), '22222222-2222-4222-8222-222222222222')$$,
  '23503', null, 'alert reconhecido por profile de outro município é rejeitado');

select throws_ok(
  $$insert into public.alert (municipality_id, risk_area_id, threshold_rule, channel, acknowledged_at)
    values ('aaaaaaaa-0000-4000-8000-00000000000a', 'dddddddd-0000-4000-8000-00000000000a',
            'density>=1/7d', 'email', now())$$,
  '23514', null, 'acknowledged_at sem acknowledged_by é rejeitado');

-- ---------------------------------------------------------------------------
-- Trilha preservada (4)
-- ---------------------------------------------------------------------------
select lives_ok(
  $$insert into public.inspection (municipality_id, report_id, agent_id, outcome, visited_at)
    values ('aaaaaaaa-0000-4000-8000-00000000000a', 'cccccccc-0000-4000-8000-00000000000a',
            '11111111-1111-4111-8111-111111111111', 'confirmed', now())$$,
  'inspection consistente é aceita');

select throws_ok(
  $$delete from public.report where id = 'cccccccc-0000-4000-8000-00000000000a'$$,
  '23503', null, 'report com inspection não pode ser apagado');

select throws_ok(
  $$delete from auth.users where id = '11111111-1111-4111-8111-111111111111'$$,
  '23503', null, 'usuário com inspection não pode ser apagado');

select throws_ok(
  $$delete from public.municipality where id = 'aaaaaaaa-0000-4000-8000-00000000000a'$$,
  '23503', null, 'município com dados não pode ser apagado');

select * from finish();
rollback;
