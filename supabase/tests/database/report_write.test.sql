-- Caminho de escrita anônimo: municípios reais, storage, submit_report, rate limit, histórico.
begin;
create extension if not exists pgtap with schema extensions;

select plan(51);

-- Pontos conferidos contra a malha do IBGE:
--   JP centro (-34.8641, -7.1195) só em João Pessoa; Cabedelo (-34.8330, -6.9810);
--   oceano (-34.60, -7.10) fora de ambos.
-- Tokens v4 de teste: 00000000-0000-4000-8000-00000000000N
-- Fotos: nomes v4 no bucket report-photos, "upload" simulado como postgres.

create function pg_temp.upload(p_name text, p_age interval default interval '0')
returns void language sql as $$
  insert into storage.objects (bucket_id, name, created_at)
  values ('report-photos', p_name, now() - p_age);
$$;

create function pg_temp.hash(t uuid) returns bytea language sql immutable as $$
  select sha256(convert_to(t::text, 'UTF8'));
$$;

-- ---------------------------------------------------------------------------
-- Municípios reais (6)
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from public.municipality where ibge_code in ('2507507', '2503209')),
  2, 'João Pessoa e Cabedelo existem');

select ok(
  (select bool_and(extensions.st_isvalid(boundary)) from public.municipality
    where ibge_code in ('2507507', '2503209')),
  'limites do IBGE são geometrias válidas');

select ok(
  (select bool_and(extensions.st_srid(boundary) = 4326
                   and extensions.geometrytype(boundary) = 'MULTIPOLYGON')
     from public.municipality where ibge_code in ('2507507', '2503209')),
  'limites são MultiPolygon SRID 4326');

select is(
  (select name from public.resolve_municipality(-34.8641, -7.1195)),
  'João Pessoa', 'centro de JP resolve para João Pessoa');

select is(
  (select name from public.resolve_municipality(-34.8330, -6.9810)),
  'Cabedelo', 'ponto de Cabedelo resolve para Cabedelo');

select is(
  (select array_to_string(proargnames, ',') from pg_proc
    where oid = 'public.resolve_municipality(double precision, double precision)'::regprocedure),
  'p_lon,p_lat,id,name', 'resolve_municipality devolve só id e nome');

-- ---------------------------------------------------------------------------
-- Bucket e storage para anon (5)
-- ---------------------------------------------------------------------------
select ok(
  (select not public and file_size_limit = 2097152
          and allowed_mime_types = array['image/webp', 'image/jpeg']
     from storage.buckets where id = 'report-photos'),
  'bucket report-photos é privado, 2 MB, só webp/jpeg');

insert into storage.buckets (id, name, public) values ('outro-bucket', 'outro-bucket', false);

set local role anon;

select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('report-photos', '20000000-0000-4000-8000-000000000001.webp')$$,
  'anon envia foto com nome válido');

select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('report-photos', 'pasta/foto.png')$$,
  '42501', null, 'anon não envia foto com nome fora do padrão');

select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('outro-bucket', '20000000-0000-4000-8000-000000000002.webp')$$,
  '42501', null, 'anon não envia para outro bucket');

select is(
  (select count(*)::int from storage.objects),
  0, 'anon não lista objetos do storage');

reset role;

-- ---------------------------------------------------------------------------
-- submit_report: caminho feliz (6)
-- ---------------------------------------------------------------------------
select pg_temp.upload('10000000-0000-4000-8000-000000000001.webp');

set local role anon;
select lives_ok(
  $$select set_config('t.r1', public.submit_report(
      '00000000-0000-4000-8000-000000000001'::uuid, -34.8641, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000001.webp', '  pneu com água  ')::text, true)$$,
  'anon cria relato válido');
reset role;

select ok(
  (select r.status = 'pending'
          and r.municipality_id = (select id from public.municipality where ibge_code = '2507507')
          and extensions.st_equals(r.geom, extensions.st_setsrid(extensions.st_makepoint(-34.8641, -7.1195), 4326))
     from public.report r where r.id = current_setting('t.r1')::uuid),
  'relato pending, município resolvido pelo ponto, geom lon/lat');

select is(
  (select reporter_token_hash from public.report where id = current_setting('t.r1')::uuid),
  pg_temp.hash('00000000-0000-4000-8000-000000000001'::uuid), 'reporter_token_hash = sha256 do token');

select is(
  (select description from public.report where id = current_setting('t.r1')::uuid),
  'pneu com água', 'descrição sem espaços nas pontas');

select ok(
  (select count(*) = 1 and bool_and(from_status is null and to_status = 'pending'
                                    and source = 'citizen' and changed_by is null)
     from public.report_status_event where report_id = current_setting('t.r1')::uuid),
  'criação gera 1 evento citizen (null → pending)');

select is(
  (select position('00000000-0000-4000-8000-000000000001'::uuid::text in row_to_json(r)::text) from public.report r
    where r.id = current_setting('t.r1')::uuid),
  0, 'token em claro não aparece no relato');

-- ---------------------------------------------------------------------------
-- Idempotência (3)
-- ---------------------------------------------------------------------------
set local role anon;
select is(
  public.submit_report('00000000-0000-4000-8000-000000000001'::uuid, -34.8641, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000001.webp', 'outro texto'),
  current_setting('t.r1')::uuid, 'reenvio com mesmo token e foto devolve o mesmo id');
reset role;

select ok(
  (select count(*) = 1 from public.report where photo_path = '10000000-0000-4000-8000-000000000001.webp')
  and (select count(*) = 1 from public.report_status_event where report_id = current_setting('t.r1')::uuid),
  'reenvio não cria relato nem evento');

set local role anon;
select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000002'::uuid, -34.8641, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000001.webp')$$,
  'PT409', 'relato: foto já usada por outro relato', 'outro token com a mesma foto → PT409');
reset role;

-- ---------------------------------------------------------------------------
-- Recusas (11)
-- ---------------------------------------------------------------------------
select pg_temp.upload('10000000-0000-4000-8000-000000000002.webp');
select pg_temp.upload('10000000-0000-4000-8000-000000000003.webp', interval '2 hours');

set local role anon;

select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000002'::uuid, -34.60, -7.10, 'pneu', '10000000-0000-4000-8000-000000000002.webp')$$,
  'PT422', 'relato: local fora dos municípios atendidos', 'ponto no oceano → PT422');

select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000002'::uuid, -34.8641, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000099.webp')$$,
  'PT404', null, 'foto não enviada → PT404');

select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000002'::uuid, -34.8641, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000003.webp')$$,
  'PT404', null, 'foto enviada há mais de 1h → PT404');

select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000002'::uuid, -34.8641, -7.1195, 'pneu', 'foto.png')$$,
  'PT422', 'relato: caminho da foto inválido', 'caminho fora do padrão → PT422');

select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000002'::uuid, -34.8641, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000002.webp', repeat('x', 501))$$,
  'PT422', 'relato: descrição acima de 500 caracteres', 'descrição > 500 → PT422');

select throws_ok(
  $$select public.submit_report('00000000-0000-0000-0000-000000000000', -34.8641, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000002.webp')$$,
  'PT422', 'relato: token do dispositivo inválido', 'token nil → PT422 (mensagem fixa, sem eco)');

select throws_ok(
  $$select public.submit_report('00000000-0000-1000-8000-000000000002', -34.8641, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000002.webp')$$,
  'PT422', 'relato: token do dispositivo inválido', 'token não v4 → PT422');

select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000002'::uuid, -34.8641, 'NaN', 'pneu', '10000000-0000-4000-8000-000000000002.webp')$$,
  'PT422', 'relato: coordenada inválida', 'latitude NaN → PT422');

select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000002'::uuid, 200, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000002.webp')$$,
  'PT422', 'relato: coordenada inválida', 'longitude fora de faixa → PT422');

select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000002'::uuid, -34.8641, -7.1195, null, '10000000-0000-4000-8000-000000000002.webp')$$,
  'PT422', 'relato: tipo de criadouro obrigatório', 'tipo nulo → PT422');

reset role;

select ok(
  (select count(*) = 1 from public.report)
  and (select count(*) = 1 from public.report_status_event),
  'recusas não criam relato nem evento');

-- ---------------------------------------------------------------------------
-- Rate limit (5)
-- ---------------------------------------------------------------------------
-- tok(3): 5 relatos na última hora
insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash)
select (select id from public.municipality where ibge_code = '2507507'),
       extensions.st_setsrid(extensions.st_makepoint(-34.8641, -7.1195), 4326),
       'pneu', 'rl3-' || g, pg_temp.hash('00000000-0000-4000-8000-000000000003'::uuid)
  from generate_series(1, 5) g;

-- tok(4): 20 relatos nas últimas 24h, todos há mais de 1h
insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash, created_at)
select (select id from public.municipality where ibge_code = '2507507'),
       extensions.st_setsrid(extensions.st_makepoint(-34.8641, -7.1195), 4326),
       'pneu', 'rl4-' || g, pg_temp.hash('00000000-0000-4000-8000-000000000004'::uuid), now() - interval '3 hours'
  from generate_series(1, 20) g;

select pg_temp.upload('10000000-0000-4000-8000-000000000004.webp');
select pg_temp.upload('10000000-0000-4000-8000-000000000005.webp');
select pg_temp.upload('10000000-0000-4000-8000-000000000006.webp');

set local role anon;

select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000003'::uuid, -34.8641, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000004.webp')$$,
  'PT429', null, '6º relato na mesma hora → PT429');

select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000004'::uuid, -34.8641, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000004.webp')$$,
  'PT429', null, '21º relato em 24h → PT429');

select lives_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000005'::uuid, -34.8641, -7.1195, 'calha', '10000000-0000-4000-8000-000000000005.webp')$$,
  'outro token no mesmo período não é afetado');

reset role;

select ok(
  (select count(*) > 0 from pg_locks where locktype = 'advisory' and pid = pg_backend_pid()),
  'rate limit usa advisory lock transacional');

-- Teto global: completa 200 relatos de JP na última hora com tokens distintos
insert into public.report (municipality_id, geom, breeding_site_type, photo_path, reporter_token_hash)
select (select id from public.municipality where ibge_code = '2507507'),
       extensions.st_setsrid(extensions.st_makepoint(-34.8641, -7.1195), 4326),
       'pneu', 'rlg-' || g, sha256(convert_to('global-' || g, 'UTF8'))
  from generate_series(1, 200 - (select count(*)::int from public.report
                                  where created_at > now() - interval '1 hour'
                                    and municipality_id = (select id from public.municipality where ibge_code = '2507507'))) g;

set local role anon;
select throws_ok(
  $$select public.submit_report('00000000-0000-4000-8000-000000000006'::uuid, -34.8641, -7.1195, 'pneu', '10000000-0000-4000-8000-000000000006.webp')$$,
  'PT429', 'relato: limite de envios do município atingido; tente mais tarde', 'teto de 200/h do município → PT429');
reset role;

-- ---------------------------------------------------------------------------
-- Histórico de status (8)
-- ---------------------------------------------------------------------------
update public.report set status = 'confirmed' where id = current_setting('t.r1')::uuid;

select ok(
  (select from_status = 'pending' and to_status = 'confirmed' and source = 'system' and changed_by is null
     from public.report_status_event
    where report_id = current_setting('t.r1')::uuid and to_status = 'confirmed'),
  'mudança via service/postgres gera evento system (pending → confirmed)');

update public.report set updated_at = '2000-01-01' where id = current_setting('t.r1')::uuid;
select is(
  (select updated_at from public.report where id = current_setting('t.r1')::uuid),
  now(), 'updated_at é mantido pelo trigger');

update public.report set status = 'confirmed' where id = current_setting('t.r1')::uuid;
select is(
  (select count(*)::int from public.report_status_event where report_id = current_setting('t.r1')::uuid),
  2, 'UPDATE sem mudança de status não gera evento');

select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
update public.report set status = 'resolved' where id = current_setting('t.r1')::uuid;
select set_config('request.jwt.claims', '', true);

select ok(
  (select source = 'staff' and changed_by = '44444444-4444-4444-8444-444444444444'
     from public.report_status_event
    where report_id = current_setting('t.r1')::uuid and to_status = 'resolved'),
  'mudança com auth.uid() gera evento staff com changed_by');

select throws_ok(
  $$update public.report_status_event set to_status = 'dismissed'$$,
  '42501', null, 'evento não pode ser alterado (nem por postgres)');

select throws_ok(
  $$delete from public.report_status_event$$,
  '42501', null, 'evento não pode ser apagado (nem por postgres)');

select throws_ok(
  $$truncate public.report_status_event$$,
  '42501', null, 'histórico não pode ser truncado');

select throws_ok(
  $$delete from public.report where id = current_setting('t.r1')::uuid$$,
  '23503', null, 'relato com histórico não é apagado (RESTRICT)');

-- ---------------------------------------------------------------------------
-- Premissas de privilégio das funções (2)
-- ---------------------------------------------------------------------------
select ok(
  (select bool_and(p.prosecdef and pg_get_userbyid(p.proowner) = 'postgres'
                   and p.proconfig @> array['search_path=""'])
     from pg_proc p
    where p.oid in ('public.submit_report(uuid, double precision, double precision, public.breeding_site_type, text, text)'::regprocedure,
                    'public.resolve_municipality(double precision, double precision)'::regprocedure,
                    'public.ping()'::regprocedure,
                    'public.can_upload_report_photo()'::regprocedure)),
  'RPCs são SECURITY DEFINER de postgres com search_path vazio');

select is(public.ping(), 1, 'ping toca o banco e devolve 1');

-- ---------------------------------------------------------------------------
-- Teto de upload (5) — por último: altera contagens do bucket
-- ---------------------------------------------------------------------------
select ok(public.can_upload_report_photo(), 'abaixo do teto, upload permitido');

insert into storage.objects (bucket_id, name)
select 'report-photos', 'cap-' || g
  from generate_series(1, 299 - (select count(*)::int from storage.objects
                                  where bucket_id = 'report-photos' and created_at > now() - interval '1 hour')) g;

set local role anon;
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('report-photos', '30000000-0000-4000-8000-000000000001.webp')$$,
  '300º upload da hora é aceito');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('report-photos', '30000000-0000-4000-8000-000000000002.webp')$$,
  '42501', null, '301º upload da hora é recusado');
reset role;

-- teto total: objetos antigos (fora da janela de 1h) até 3000
-- storage.protect_delete bloqueia DELETE direto; liberado só nesta transação de teste.
select set_config('storage.allow_delete_query', 'true', true);
delete from storage.objects where bucket_id = 'report-photos' and name like 'cap-%';
select set_config('storage.allow_delete_query', 'false', true);
insert into storage.objects (bucket_id, name, created_at)
select 'report-photos', 'old-' || g, now() - interval '2 days'
  from generate_series(1, 3000 - (select count(*)::int from storage.objects where bucket_id = 'report-photos')) g;

select ok(not public.can_upload_report_photo(), 'teto total de 3000 objetos atingido');

set local role anon;
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('report-photos', '30000000-0000-4000-8000-000000000003.webp')$$,
  '42501', null, 'upload recusado com bucket no teto total');
reset role;

select * from finish();
rollback;
