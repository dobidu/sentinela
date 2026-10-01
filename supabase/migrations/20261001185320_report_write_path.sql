-- Caminho de escrita anônimo do relato (plano 02-01).
--
-- * Municípios reais de produção (João Pessoa, Cabedelo) com limites do IBGE.
-- * report_status_event: histórico append-only de status, com origem.
-- * Bucket privado `report-photos`: anon só faz INSERT, com teto de volume.
-- * RPCs para anon: submit_report, resolve_municipality, ping, can_upload_report_photo.
--
-- Contrato de erro (SQLSTATE PTnnn → HTTP nnn no PostgREST):
--   PT422  validação: token, coordenada, tipo, caminho da foto, descrição, fora dos municípios
--   PT404  foto não encontrada no bucket ou enviada há mais de 1h (refazer upload e retentar)
--   PT409  foto já usada por outro relato de outro dispositivo (permanente)
--   PT429  limite de envio atingido (retentar mais tarde)

-- ---------------------------------------------------------------------------
-- Municípios de produção
-- Fonte: IBGE, API de malhas v3 (servicodados.ibge.gov.br/api/v3/malhas/municipios/{código}
-- ?formato=application/vnd.geo+json&qualidade=maxima), baixado em 2026-10-01.
-- A malha está em SIRGAS 2000 (EPSG:4674); a diferença para WGS 84 (4326) é
-- submétrica, então a geometria é gravada como 4326 sem reprojeção.
-- ---------------------------------------------------------------------------

insert into public.municipality (name, ibge_code, boundary) values
  ('João Pessoa', '2507507',
   extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson('{"type":"Polygon","coordinates":[[[-34.9295,-7.2255],[-34.9284,-7.2239],[-34.9184,-7.2192],[-34.9167,-7.218],[-34.9132,-7.2137],[-34.9123,-7.2129],[-34.9063,-7.2122],[-34.9048,-7.2125],[-34.9011,-7.2142],[-34.8946,-7.215],[-34.8897,-7.2144],[-34.8788,-7.2188],[-34.8767,-7.2207],[-34.8737,-7.2212],[-34.8722,-7.2204],[-34.8709,-7.222],[-34.8719,-7.223],[-34.8718,-7.2245],[-34.8691,-7.2249],[-34.8695,-7.2276],[-34.866,-7.2266],[-34.865,-7.2278],[-34.863,-7.2276],[-34.862,-7.2296],[-34.861,-7.2286],[-34.8583,-7.2285],[-34.8575,-7.2304],[-34.8563,-7.2308],[-34.8552,-7.2322],[-34.8535,-7.2309],[-34.8519,-7.2317],[-34.8506,-7.2317],[-34.8515,-7.2336],[-34.8504,-7.235],[-34.8477,-7.233],[-34.8466,-7.2318],[-34.8451,-7.232],[-34.8459,-7.2351],[-34.8436,-7.2347],[-34.8432,-7.2361],[-34.8416,-7.2365],[-34.8413,-7.2343],[-34.8401,-7.2341],[-34.8375,-7.2368],[-34.8367,-7.2343],[-34.8382,-7.2326],[-34.8381,-7.232],[-34.8338,-7.2307],[-34.8339,-7.2288],[-34.8313,-7.228],[-34.8309,-7.2295],[-34.8312,-7.2307],[-34.8298,-7.231],[-34.8287,-7.2297],[-34.8268,-7.2307],[-34.826,-7.2296],[-34.8226,-7.2299],[-34.8224,-7.2321],[-34.8251,-7.2314],[-34.8252,-7.2353],[-34.8239,-7.236],[-34.8203,-7.2349],[-34.8195,-7.2332],[-34.8173,-7.2348],[-34.8172,-7.2362],[-34.8184,-7.2378],[-34.818,-7.2387],[-34.8167,-7.2389],[-34.8149,-7.2374],[-34.812,-7.2375],[-34.8104,-7.2359],[-34.8076,-7.2361],[-34.807,-7.2372],[-34.8073,-7.2389],[-34.8083,-7.2412],[-34.8082,-7.2451],[-34.8077,-7.2458],[-34.8058,-7.2445],[-34.8059,-7.2427],[-34.8046,-7.2358],[-34.8036,-7.2333],[-34.8046,-7.2327],[-34.8049,-7.2306],[-34.804,-7.2224],[-34.8041,-7.218],[-34.8035,-7.2138],[-34.8023,-7.2088],[-34.8001,-7.203],[-34.7972,-7.1986],[-34.7952,-7.1959],[-34.7947,-7.1942],[-34.7946,-7.1917],[-34.795,-7.1909],[-34.7958,-7.1857],[-34.7959,-7.1775],[-34.7956,-7.1755],[-34.7961,-7.1741],[-34.7954,-7.1647],[-34.795,-7.1621],[-34.7932,-7.1558],[-34.7932,-7.1546],[-34.7943,-7.1525],[-34.7968,-7.147],[-34.7982,-7.1462],[-34.8017,-7.1459],[-34.8037,-7.1454],[-34.8092,-7.1455],[-34.8116,-7.1443],[-34.8163,-7.1396],[-34.8187,-7.1362],[-34.8215,-7.1298],[-34.8225,-7.1261],[-34.8229,-7.1214],[-34.8226,-7.1193],[-34.8211,-7.1122],[-34.8214,-7.1112],[-34.8266,-7.1072],[-34.8297,-7.1036],[-34.8315,-7.101],[-34.8323,-7.0991],[-34.833,-7.0961],[-34.8332,-7.0914],[-34.8325,-7.0866],[-34.8298,-7.0793],[-34.83,-7.0775],[-34.8296,-7.0753],[-34.8302,-7.0734],[-34.8318,-7.0721],[-34.8347,-7.0703],[-34.8368,-7.0683],[-34.8399,-7.0642],[-34.8414,-7.0609],[-34.842,-7.059],[-34.8424,-7.056],[-34.8447,-7.0562],[-34.8466,-7.0569],[-34.8469,-7.0579],[-34.849,-7.06],[-34.8493,-7.0632],[-34.8483,-7.0682],[-34.8474,-7.0697],[-34.8468,-7.074],[-34.8471,-7.0758],[-34.8467,-7.0794],[-34.8473,-7.0822],[-34.8474,-7.0852],[-34.8469,-7.0932],[-34.8456,-7.0978],[-34.8455,-7.0994],[-34.8486,-7.0999],[-34.8501,-7.0982],[-34.8509,-7.0982],[-34.8518,-7.0968],[-34.8546,-7.0964],[-34.8555,-7.0952],[-34.8593,-7.0951],[-34.8595,-7.0932],[-34.8581,-7.0915],[-34.8574,-7.0897],[-34.8579,-7.0883],[-34.859,-7.088],[-34.8619,-7.0882],[-34.8628,-7.0879],[-34.8634,-7.0865],[-34.8635,-7.0842],[-34.8657,-7.0815],[-34.8659,-7.08],[-34.8648,-7.0775],[-34.8634,-7.0766],[-34.8608,-7.0763],[-34.8595,-7.0756],[-34.859,-7.0746],[-34.8596,-7.0707],[-34.859,-7.0684],[-34.8574,-7.0662],[-34.857,-7.0642],[-34.8581,-7.0624],[-34.8634,-7.0608],[-34.872,-7.0709],[-34.8783,-7.0783],[-34.8864,-7.088],[-34.8914,-7.0939],[-34.8926,-7.097],[-34.8962,-7.1032],[-34.8953,-7.1059],[-34.8937,-7.1079],[-34.8914,-7.1093],[-34.8908,-7.1118],[-34.8939,-7.1166],[-34.8941,-7.1217],[-34.8957,-7.1223],[-34.8982,-7.1208],[-34.9008,-7.1209],[-34.9016,-7.1223],[-34.9021,-7.1246],[-34.9031,-7.1258],[-34.9048,-7.1267],[-34.9066,-7.1269],[-34.9082,-7.1282],[-34.9121,-7.1278],[-34.9134,-7.1295],[-34.9156,-7.1305],[-34.9179,-7.1325],[-34.9193,-7.1351],[-34.9181,-7.1357],[-34.9186,-7.137],[-34.9158,-7.144],[-34.915,-7.1452],[-34.912,-7.1476],[-34.9098,-7.151],[-34.9099,-7.1518],[-34.9124,-7.1534],[-34.9126,-7.1568],[-34.9125,-7.1587],[-34.9129,-7.1602],[-34.9142,-7.1629],[-34.9161,-7.1647],[-34.9163,-7.1664],[-34.9185,-7.1685],[-34.923,-7.1712],[-34.9253,-7.1703],[-34.9266,-7.1676],[-34.9276,-7.1671],[-34.9301,-7.1674],[-34.9337,-7.1687],[-34.9352,-7.1678],[-34.9361,-7.1666],[-34.938,-7.165],[-34.9403,-7.1647],[-34.9416,-7.1638],[-34.9462,-7.1636],[-34.9489,-7.1647],[-34.9499,-7.1663],[-34.951,-7.1671],[-34.9516,-7.1689],[-34.953,-7.1688],[-34.9544,-7.1679],[-34.9564,-7.1679],[-34.9582,-7.1672],[-34.9604,-7.1674],[-34.9613,-7.1669],[-34.9628,-7.1675],[-34.9653,-7.1694],[-34.966,-7.1695],[-34.9676,-7.1714],[-34.9702,-7.173],[-34.9706,-7.1737],[-34.9709,-7.1769],[-34.9726,-7.1773],[-34.9725,-7.1791],[-34.9705,-7.1821],[-34.9687,-7.2148],[-34.9675,-7.2161],[-34.9645,-7.2149],[-34.9623,-7.215],[-34.9602,-7.2141],[-34.9578,-7.2137],[-34.9555,-7.2141],[-34.9535,-7.2155],[-34.9522,-7.2156],[-34.9488,-7.2142],[-34.9431,-7.2129],[-34.9395,-7.2131],[-34.9358,-7.2139],[-34.935,-7.2145],[-34.9335,-7.2172],[-34.9332,-7.2188],[-34.9322,-7.2196],[-34.9319,-7.2212],[-34.9311,-7.2218],[-34.9307,-7.2241],[-34.9295,-7.2255]]]}'), 4326))),
  ('Cabedelo', '2503209',
   extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-34.8424,-7.056],[-34.8423,-7.0527],[-34.8417,-7.0487],[-34.8403,-7.0448],[-34.8382,-7.0407],[-34.8358,-7.0373],[-34.8339,-7.0351],[-34.8306,-7.0324],[-34.8296,-7.0307],[-34.8296,-7.0252],[-34.8292,-7.0185],[-34.8282,-7.0155],[-34.8266,-7.0092],[-34.8255,-7.0058],[-34.8252,-7.0011],[-34.826,-6.9965],[-34.827,-6.9896],[-34.8275,-6.9808],[-34.828,-6.9732],[-34.8286,-6.9695],[-34.8301,-6.9662],[-34.8316,-6.9652],[-34.8353,-6.9646],[-34.8403,-6.9629],[-34.8431,-6.9624],[-34.8431,-6.9653],[-34.8425,-6.9668],[-34.8407,-6.9697],[-34.8408,-6.9704],[-34.8375,-6.9759],[-34.836,-6.9775],[-34.8356,-6.9797],[-34.8357,-6.9816],[-34.8348,-6.9841],[-34.8342,-6.9876],[-34.834,-6.9911],[-34.8343,-6.9948],[-34.8359,-7.0003],[-34.8354,-7.0017],[-34.8349,-7.0049],[-34.8371,-7.01],[-34.8382,-7.0117],[-34.8427,-7.0163],[-34.8472,-7.0202],[-34.8504,-7.0241],[-34.8526,-7.0259],[-34.855,-7.0288],[-34.8571,-7.0296],[-34.859,-7.0297],[-34.8599,-7.033],[-34.8607,-7.0381],[-34.8625,-7.0485],[-34.8631,-7.0538],[-34.8634,-7.0608],[-34.8581,-7.0624],[-34.857,-7.0642],[-34.8574,-7.0662],[-34.859,-7.0684],[-34.8596,-7.0707],[-34.859,-7.0746],[-34.8595,-7.0756],[-34.8608,-7.0763],[-34.8634,-7.0766],[-34.8648,-7.0775],[-34.8659,-7.08],[-34.8657,-7.0815],[-34.8635,-7.0842],[-34.8634,-7.0865],[-34.8628,-7.0879],[-34.8619,-7.0882],[-34.859,-7.088],[-34.8579,-7.0883],[-34.8574,-7.0897],[-34.8581,-7.0915],[-34.8595,-7.0932],[-34.8593,-7.0951],[-34.8555,-7.0952],[-34.8546,-7.0964],[-34.8518,-7.0968],[-34.8509,-7.0982],[-34.8501,-7.0982],[-34.8486,-7.0999],[-34.8455,-7.0994],[-34.8456,-7.0978],[-34.8469,-7.0932],[-34.8474,-7.0852],[-34.8473,-7.0822],[-34.8467,-7.0794],[-34.8471,-7.0758],[-34.8468,-7.074],[-34.8474,-7.0697],[-34.8483,-7.0682],[-34.8493,-7.0632],[-34.849,-7.06],[-34.8469,-7.0579],[-34.8466,-7.0569],[-34.8447,-7.0562],[-34.8424,-7.056]]],[[[-34.8616,-6.9824],[-34.8609,-6.9809],[-34.8611,-6.9796],[-34.8663,-6.9816],[-34.8673,-6.9839],[-34.8674,-6.9864],[-34.868,-6.988],[-34.8673,-6.993],[-34.8655,-7.0015],[-34.8623,-7.0079],[-34.861,-7.0108],[-34.8594,-7.0153],[-34.8586,-7.0152],[-34.8578,-7.0138],[-34.8565,-7.0129],[-34.8506,-7.0045],[-34.8497,-7.0021],[-34.8493,-6.9984],[-34.848,-6.9943],[-34.8475,-6.9921],[-34.8472,-6.9887],[-34.8478,-6.9873],[-34.8473,-6.9859],[-34.8476,-6.9831],[-34.85,-6.9823],[-34.8544,-6.9823],[-34.8561,-6.9826],[-34.8576,-6.9834],[-34.8616,-6.9824]]]]}'), 4326)));

-- ---------------------------------------------------------------------------
-- report: updated_at + foto única
-- ---------------------------------------------------------------------------

alter table public.report
  add column updated_at timestamptz not null default now(),
  add constraint report_photo_path_key unique (photo_path);

create function public.report_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger report_set_updated_at
  before update on public.report
  for each row execute function public.report_set_updated_at();

-- ---------------------------------------------------------------------------
-- report_status_event (append-only)
-- ---------------------------------------------------------------------------

create table public.report_status_event (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipality (id) on delete restrict,
  report_id uuid not null,
  from_status public.report_status,
  to_status public.report_status not null,
  source text not null check (source in ('citizen', 'staff', 'system')),
  changed_by uuid,
  changed_at timestamptz not null default now(),
  foreign key (report_id, municipality_id)
    references public.report (id, municipality_id) on delete restrict
);

create index report_status_event_report_idx
  on public.report_status_event (report_id, municipality_id, changed_at);
create index report_status_event_municipality_idx
  on public.report_status_event (municipality_id, changed_at desc);

comment on table public.report_status_event is
  'Trilha append-only de status do relato. source: citizen (criação via submit_report), staff (auth.uid() presente), system (demais, ex.: service_role).';

alter table public.report_status_event enable row level security;

create policy report_status_event_select_same_municipality on public.report_status_event
  for select to authenticated
  using (
    municipality_id = (select public.current_municipality_id())
    and (select public.current_app_role()) is not null
  );

create function public.report_log_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source text;
begin
  if tg_op = 'INSERT' and coalesce(current_setting('sentinela.source', true), '') = 'citizen' then
    v_source := 'citizen';
  elsif auth.uid() is not null then
    v_source := 'staff';
  else
    v_source := 'system';
  end if;

  insert into public.report_status_event
    (municipality_id, report_id, from_status, to_status, source, changed_by)
  values
    (new.municipality_id, new.id,
     case when tg_op = 'UPDATE' then old.status end,
     new.status, v_source, auth.uid());

  return null;
end;
$$;

create trigger report_log_status_insert
  after insert on public.report
  for each row execute function public.report_log_status();

create trigger report_log_status_update
  after update of status on public.report
  for each row
  when (old.status is distinct from new.status)
  execute function public.report_log_status();

create function public.report_status_event_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'report_status_event é append-only (% recusado)', tg_op
    using errcode = '42501';
end;
$$;

create trigger report_status_event_no_update_delete
  before update or delete on public.report_status_event
  for each row execute function public.report_status_event_immutable();

create trigger report_status_event_no_truncate
  before truncate on public.report_status_event
  for each statement execute function public.report_status_event_immutable();

-- ---------------------------------------------------------------------------
-- Storage: bucket privado de fotos de relato
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', false, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

-- Teto de upload: anon não lê storage.objects, então a contagem roda como owner.
create function public.can_upload_report_photo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from storage.objects o
      where o.bucket_id = 'report-photos' and o.created_at > now() - interval '1 hour') < 300
    and
    (select count(*) from storage.objects o
      where o.bucket_id = 'report-photos') < 3000;
$$;

create policy report_photos_insert on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'report-photos'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webp|jpg)$'
    and (select public.can_upload_report_photo())
  );

-- ---------------------------------------------------------------------------
-- RPCs públicas
-- ---------------------------------------------------------------------------

create function public.ping()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from (select 1 from public.municipality limit 1) s;
$$;

create function public.resolve_municipality(p_lon double precision, p_lat double precision)
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.name
    from public.municipality m
   where p_lon between -180 and 180
     and p_lat between -90 and 90
     and extensions.st_covers(m.boundary, extensions.st_setsrid(extensions.st_makepoint(p_lon, p_lat), 4326))
   order by m.ibge_code
   limit 1;
$$;

create function public.submit_report(
  p_reporter_token uuid,
  p_lon double precision,
  p_lat double precision,
  p_breeding_site_type public.breeding_site_type,
  p_photo_path text,
  p_description text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_hash bytea;
  v_description text;
  v_point extensions.geometry;
  v_municipality_id uuid;
  v_existing_id uuid;
  v_existing_hash bytea;
  v_id uuid;
begin
  -- 1. Validação de entrada (nenhuma mensagem ecoa parâmetros)
  if p_reporter_token is null
     or p_reporter_token = '00000000-0000-0000-0000-000000000000'::uuid
     or (get_byte(uuid_send(p_reporter_token), 6) >> 4) <> 4
     or (get_byte(uuid_send(p_reporter_token), 8) >> 6) <> 2 then
    raise exception using errcode = 'PT422', message = 'relato: token do dispositivo inválido';
  end if;

  -- NaN e ±Infinity também falham no between.
  if p_lon is null or p_lat is null
     or not (p_lon between -180 and 180)
     or not (p_lat between -90 and 90) then
    raise exception using errcode = 'PT422', message = 'relato: coordenada inválida';
  end if;

  if p_breeding_site_type is null then
    raise exception using errcode = 'PT422', message = 'relato: tipo de criadouro obrigatório';
  end if;

  if p_photo_path is null
     or p_photo_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webp|jpg)$' then
    raise exception using errcode = 'PT422', message = 'relato: caminho da foto inválido';
  end if;

  v_description := nullif(btrim(p_description), '');
  if char_length(v_description) > 500 then
    raise exception using errcode = 'PT422', message = 'relato: descrição acima de 500 caracteres';
  end if;

  v_hash := sha256(convert_to(p_reporter_token::text, 'UTF8'));

  -- 2. Reenvio idempotente: mesma foto + mesmo dispositivo devolve o relato existente.
  select r.id, r.reporter_token_hash
    into v_existing_id, v_existing_hash
    from public.report r
   where r.photo_path = p_photo_path;

  if found then
    if v_existing_hash = v_hash then
      return v_existing_id;
    end if;
    raise exception using errcode = 'PT409', message = 'relato: foto já usada por outro relato';
  end if;

  -- 3. Município resolvido pelo ponto (nunca informado pelo cliente)
  v_point := extensions.st_setsrid(extensions.st_makepoint(p_lon, p_lat), 4326);

  select m.id
    into v_municipality_id
    from public.municipality m
   where extensions.st_covers(m.boundary, v_point)
   order by m.ibge_code
   limit 1;

  if v_municipality_id is null then
    raise exception using errcode = 'PT422', message = 'relato: local fora dos municípios atendidos';
  end if;

  -- 4. Foto presente no bucket e recente
  perform 1
     from storage.objects o
    where o.bucket_id = 'report-photos'
      and o.name = p_photo_path
      and o.created_at > now() - interval '1 hour';

  if not found then
    raise exception using errcode = 'PT404', message = 'relato: foto não encontrada ou expirada; envie a foto novamente';
  end if;

  -- 5. Rate limit serializado (por dispositivo, depois teto global do município)
  perform pg_advisory_xact_lock(hashtextextended('report_rl:' || encode(v_hash, 'hex'), 0));

  if (select count(*) from public.report r
       where r.reporter_token_hash = v_hash and r.created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.report r
       where r.reporter_token_hash = v_hash and r.created_at > now() - interval '24 hours') >= 20 then
    raise exception using errcode = 'PT429', message = 'relato: limite de envios deste dispositivo atingido; tente mais tarde';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('report_rl_mun:' || v_municipality_id::text, 0));

  if (select count(*) from public.report r
       where r.municipality_id = v_municipality_id and r.created_at > now() - interval '1 hour') >= 200 then
    raise exception using errcode = 'PT429', message = 'relato: limite de envios do município atingido; tente mais tarde';
  end if;

  -- 6. Insert (o trigger de status lê sentinela.source)
  perform set_config('sentinela.source', 'citizen', true);

  begin
    insert into public.report
      (municipality_id, geom, breeding_site_type, photo_path, description, reporter_token_hash)
    values
      (v_municipality_id, v_point, p_breeding_site_type, p_photo_path, v_description, v_hash)
    returning id into v_id;
  exception when unique_violation then
    -- Corrida com outro envio da mesma foto: mesma regra do passo 2.
    perform set_config('sentinela.source', '', true);
    select r.id, r.reporter_token_hash
      into v_existing_id, v_existing_hash
      from public.report r
     where r.photo_path = p_photo_path;
    if found and v_existing_hash = v_hash then
      return v_existing_id;
    end if;
    raise exception using errcode = 'PT409', message = 'relato: foto já usada por outro relato';
  end;

  perform set_config('sentinela.source', '', true);
  return v_id;
end;
$$;

comment on function public.submit_report(uuid, double precision, double precision, public.breeding_site_type, text, text) is
  'Relato anônimo. Erros: PT422 validação/fora do município; PT404 foto ausente ou > 1h (reenviar foto); PT409 foto de outro dispositivo; PT429 limite (5/h e 20/24h por dispositivo; 200/h por município). Reenvio com mesmo token e foto devolve o mesmo id.';

-- ---------------------------------------------------------------------------
-- Privilégios: anon/authenticated executam exatamente estas funções
-- ---------------------------------------------------------------------------

revoke all on function public.ping() from public;
revoke all on function public.resolve_municipality(double precision, double precision) from public;
revoke all on function public.can_upload_report_photo() from public;
revoke all on function public.submit_report(uuid, double precision, double precision, public.breeding_site_type, text, text) from public;
revoke all on function public.report_set_updated_at() from public, anon, authenticated;
revoke all on function public.report_log_status() from public, anon, authenticated;
revoke all on function public.report_status_event_immutable() from public, anon, authenticated;

grant execute on function public.ping() to anon, authenticated;
grant execute on function public.resolve_municipality(double precision, double precision) to anon, authenticated;
grant execute on function public.can_upload_report_photo() to anon, authenticated;
grant execute on function public.submit_report(uuid, double precision, double precision, public.breeding_site_type, text, text) to anon, authenticated;
