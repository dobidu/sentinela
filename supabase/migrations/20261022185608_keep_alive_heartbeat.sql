-- Keep-alive do free tier com escrita real no banco (plano 02-02).
--
-- Evidência: o ping REST a cada 3 dias (RPC `ping`) não impediu a pausa do
-- projeto entre 2026-10-10 (HTTP 200) e 2026-10-13 (DNS fora). O workflow
-- keep-alive passa a abrir uma conexão Postgres e gravar um heartbeat por dia.
--
-- * `private.keep_alive_beat` é append-only na prática (insert + prune de 90
--   dias), para reconstruir a última atividade antes de uma pausa.
-- * O workflow NÃO usa a credencial de owner do CD. Usa o role
--   `keep_alive_writer`, confinado a esta tabela. O role nasce NOLOGIN e sem
--   senha (repo público); o login é ativado fora do repo:
--     alter role keep_alive_writer with login password '...';
-- * Roles são globais ao cluster: `supabase db reset` mantém o role, por isso
--   a criação é condicional.

create table private.keep_alive_beat (
  id bigint generated always as identity primary key,
  beat_at timestamptz not null default now(),
  source text not null default 'github-actions' check (length(source) <= 64)
);

alter table private.keep_alive_beat enable row level security;

revoke all on table private.keep_alive_beat from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'keep_alive_writer') then
    create role keep_alive_writer nologin noinherit;
  end if;
end
$$;

grant usage on schema private to keep_alive_writer;
-- select é necessário para `returning` e para o where do prune.
grant select, insert, delete on table private.keep_alive_beat to keep_alive_writer;

create policy keep_alive_beat_writer on private.keep_alive_beat
  for all
  to keep_alive_writer
  using (true)
  with check (true);
