-- Seed SINTÉTICO, só para desenvolvimento local e CI. Nunca aplicar em ambiente remoto.
--
-- Os códigos IBGE são reais, mas os limites são retângulos aproximados,
-- NÃO os limites oficiais dos municípios.

insert into public.municipality (id, name, ibge_code, boundary) values
  (
    '00000000-0000-4000-8000-000000000001',
    'João Pessoa (sintético)',
    '2507507',
    extensions.st_multi(extensions.st_makeenvelope(-34.97, -7.25, -34.79, -7.05, 4326))
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Cabedelo (sintético)',
    '2503209',
    extensions.st_multi(extensions.st_makeenvelope(-34.87, -7.04, -34.81, -6.96, 4326))
  );
