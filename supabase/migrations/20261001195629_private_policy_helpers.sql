-- Separa funções usadas só por policies da API pública (forward-fix do plano 02-01).
--
-- O advisor de segurança do Supabase (lints 0028/0029) aponta funções
-- SECURITY DEFINER executáveis por anon/authenticated via /rest/v1/rpc.
-- * Helpers de policy vão para o schema `private`, que não é exposto pelo
--   PostgREST. As policies referenciam funções por OID e continuam valendo.
-- * `ping` não precisa ler tabela: vira SECURITY INVOKER.
-- * `submit_report` e `resolve_municipality` continuam SECURITY DEFINER em
--   public de propósito (contrato público do relato anônimo); são as únicas
--   exceções aceitas do advisor.

create schema if not exists private;

revoke all on schema private from public;
-- Policies avaliadas como anon/authenticated precisam de USAGE no schema.
grant usage on schema private to anon, authenticated;

alter function public.can_upload_report_photo() set schema private;
alter function public.current_app_role() set schema private;
alter function public.current_municipality_id() set schema private;

create or replace function public.ping()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select 1;
$$;
