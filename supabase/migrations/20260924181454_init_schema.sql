-- Schema inicial do Sentinela: PostGIS + 6 entidades com escopo de município.
--
-- Regras de modelagem:
-- * Toda tabela de domínio carrega `municipality_id NOT NULL` (multi-município desde o dia 1).
-- * Consistência de tenant entre tabelas relacionadas é garantida por FKs compostas
--   `(x_id, municipality_id)`, não por triggers.
-- * Nenhuma FK apaga histórico em cascata; o único CASCADE é profile -> auth.users,
--   que fica bloqueado na prática pelos RESTRICT quando o usuário tem histórico.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('agent', 'surveillance', 'admin');

create type public.report_status as enum ('pending', 'confirmed', 'dismissed', 'resolved');

create type public.breeding_site_type as enum (
  'pneu',
  'caixa_dagua',
  'vaso_planta',
  'lixo_entulho',
  'calha',
  'piscina',
  'recipiente_diverso',
  'outro'
);

create type public.risk_level as enum ('low', 'medium', 'high');

create type public.inspection_outcome as enum ('confirmed', 'dismissed', 'resolved', 'not_found');

-- ---------------------------------------------------------------------------
-- municipality
-- ---------------------------------------------------------------------------

create table public.municipality (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ibge_code char(7) not null unique check (ibge_code ~ '^[0-9]{7}$'),
  boundary extensions.geometry(MultiPolygon, 4326) not null,
  created_at timestamptz not null default now()
);

create index municipality_boundary_gix on public.municipality using gist (boundary);

-- ---------------------------------------------------------------------------
-- profile (1:1 com auth.users)
-- ---------------------------------------------------------------------------

create table public.profile (
  id uuid primary key references auth.users (id) on delete cascade,
  municipality_id uuid not null references public.municipality (id) on delete restrict,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (id, municipality_id)
);

create index profile_municipality_idx on public.profile (municipality_id);

-- ---------------------------------------------------------------------------
-- report
-- ---------------------------------------------------------------------------

create table public.report (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipality (id) on delete restrict,
  geom extensions.geometry(Point, 4326) not null,
  breeding_site_type public.breeding_site_type not null,
  photo_path text not null,
  description text check (char_length(description) <= 500),
  status public.report_status not null default 'pending',
  reporter_token_hash bytea not null check (octet_length(reporter_token_hash) = 32),
  created_at timestamptz not null default now(),
  unique (id, municipality_id)
);

create index report_geom_gix on public.report using gist (geom);
create index report_municipality_created_idx on public.report (municipality_id, created_at desc);
create index report_reporter_token_created_idx on public.report (reporter_token_hash, created_at);

comment on column public.report.geom is
  'Dado pessoal de terceiro (LGPD): precisão exata visível só para staff; camada pública usa grid generalizado.';
comment on column public.report.photo_path is
  'Caminho no bucket privado. Nunca persistir URL: a leitura gera URL assinada.';
comment on column public.report.reporter_token_hash is
  'SHA-256 (32 bytes), calculado no servidor, de um token aleatório >= 122 bits gerado no dispositivo (crypto.randomUUID). O token em si nunca é armazenado.';
comment on column public.report.description is
  'Texto livre do cidadão: pode conter dado pessoal (LGPD).';

-- Rejeita ponto fora do limite do município. SECURITY DEFINER para não depender
-- da visibilidade de `municipality` do role que insere (fail-closed).
create function public.report_enforce_boundary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_boundary extensions.geometry;
begin
  select m.boundary
    into v_boundary
    from public.municipality m
   where m.id = new.municipality_id;

  if not found or v_boundary is null then
    raise exception 'report: município % inexistente ou sem limite definido', new.municipality_id
      using errcode = '23503';
  end if;

  if not coalesce(extensions.st_covers(v_boundary, new.geom), false) then
    raise exception 'report: ponto fora do limite do município %', new.municipality_id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger report_enforce_boundary
  before insert or update of geom, municipality_id on public.report
  for each row execute function public.report_enforce_boundary();

-- ---------------------------------------------------------------------------
-- risk_area (materializada pelo job de agregação)
-- ---------------------------------------------------------------------------

create table public.risk_area (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipality (id) on delete restrict,
  geom extensions.geometry(Polygon, 4326) not null,
  report_count integer not null check (report_count >= 0),
  risk_level public.risk_level not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  computed_at timestamptz not null default now(),
  check (window_end > window_start),
  unique (id, municipality_id)
);

create index risk_area_geom_gix on public.risk_area using gist (geom);
create index risk_area_municipality_idx on public.risk_area (municipality_id);

-- ---------------------------------------------------------------------------
-- alert
-- ---------------------------------------------------------------------------

create table public.alert (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipality (id) on delete restrict,
  risk_area_id uuid not null,
  threshold_rule text not null,
  channel text not null,
  sent_at timestamptz,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  created_at timestamptz not null default now(),
  check ((acknowledged_at is null) = (acknowledged_by is null)),
  foreign key (risk_area_id, municipality_id)
    references public.risk_area (id, municipality_id) on delete restrict,
  foreign key (acknowledged_by, municipality_id)
    references public.profile (id, municipality_id) on delete restrict
);

create index alert_municipality_idx on public.alert (municipality_id);
create index alert_risk_area_idx on public.alert (risk_area_id, municipality_id);
create index alert_acknowledged_by_idx on public.alert (acknowledged_by, municipality_id);

-- ---------------------------------------------------------------------------
-- inspection (trilha de visita de campo — nunca apagada em cascata)
-- ---------------------------------------------------------------------------

create table public.inspection (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipality (id) on delete restrict,
  report_id uuid not null,
  agent_id uuid not null,
  outcome public.inspection_outcome not null,
  visited_at timestamptz not null,
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  foreign key (report_id, municipality_id)
    references public.report (id, municipality_id) on delete restrict,
  foreign key (agent_id, municipality_id)
    references public.profile (id, municipality_id) on delete restrict
);

create index inspection_municipality_idx on public.inspection (municipality_id);
create index inspection_report_idx on public.inspection (report_id, municipality_id);
create index inspection_agent_idx on public.inspection (agent_id, municipality_id);
