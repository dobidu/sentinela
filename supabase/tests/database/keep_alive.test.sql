-- Heartbeat do keep-alive e confinamento do role keep_alive_writer.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

-- ---------------------------------------------------------------------------
-- Tabela
-- ---------------------------------------------------------------------------
select has_table('private', 'keep_alive_beat', 'private.keep_alive_beat existe');
select ok(
  (select relrowsecurity from pg_class where oid = 'private.keep_alive_beat'::regclass),
  'RLS habilitada em keep_alive_beat');

select ok(not has_table_privilege('anon', 'private.keep_alive_beat', 'select,insert,update,delete'),
  'anon sem privilégio em keep_alive_beat');
select ok(not has_table_privilege('authenticated', 'private.keep_alive_beat', 'select,insert,update,delete'),
  'authenticated sem privilégio em keep_alive_beat');

-- ---------------------------------------------------------------------------
-- Atributos do role
-- ---------------------------------------------------------------------------
select is(
  (select row(rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolreplication)::text
     from pg_roles where rolname = 'keep_alive_writer'),
  '(f,f,f,f,f)',
  'keep_alive_writer sem superuser, bypassrls, createrole, createdb, replication');

select is(
  (select count(*)::int from pg_auth_members m
     where m.member = 'keep_alive_writer'::regrole),
  0, 'keep_alive_writer não é membro de nenhum role');

select ok(not has_table_privilege('keep_alive_writer', 'private.keep_alive_beat', 'update'),
  'keep_alive_writer não faz update no heartbeat');

-- ---------------------------------------------------------------------------
-- Comportamento como keep_alive_writer
-- ---------------------------------------------------------------------------
-- Só dentro desta transação (rollback no fim): postgres precisa de SET no role
-- para assumi-lo, e o role precisa de USAGE em extensions para chamar o pgTAP.
grant keep_alive_writer to current_user with set true, inherit false;
grant usage on schema extensions to keep_alive_writer;

set local role keep_alive_writer;

select lives_ok(
  $$ insert into private.keep_alive_beat default values $$,
  'keep_alive_writer insere heartbeat');

select is(
  (select source from private.keep_alive_beat order by id desc limit 1),
  'github-actions', 'source padrão é github-actions');

select lives_ok(
  $$ delete from private.keep_alive_beat where beat_at < now() - interval '90 days' $$,
  'keep_alive_writer faz o prune de 90 dias');

select throws_ok(
  $$ select 1 from public.report limit 1 $$,
  '42501', null, 'keep_alive_writer não lê public.report');

select throws_ok(
  $$ select 1 from public.municipality limit 1 $$,
  '42501', null, 'keep_alive_writer não lê public.municipality');

select throws_ok(
  $$ select 1 from public.report_status_event limit 1 $$,
  '42501', null, 'keep_alive_writer não lê public.report_status_event');

select throws_ok(
  $$ select 1 from storage.objects limit 1 $$,
  '42501', null, 'keep_alive_writer não lê storage.objects');

select throws_ok(
  $$ select private.current_app_role() $$,
  '42501', null, 'keep_alive_writer não executa helpers de private');

select throws_ok(
  $$ create table private.x (id int) $$,
  '42501', null, 'keep_alive_writer não cria objetos em private');

reset role;

select throws_ok(
  $$ insert into private.keep_alive_beat (source) values (repeat('x', 65)) $$,
  '23514', null, 'source limitado a 64 caracteres');

select * from finish();
rollback;
