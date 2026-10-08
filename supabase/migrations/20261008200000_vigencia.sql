-- Verificación mínima de vigencia. La ingesta lee el título de cada norma nueva y
-- registra qué otras normas declara derogar, modificar o dejar sin efecto. La norma
-- afectada se reconoce por su clave (tipo y número sin tildes, en minúsculas), así
-- que el vínculo funciona aunque la afectada aún no esté cargada.

alter table public.normas add column if not exists clave text;
create index if not exists normas_clave_idx on public.normas (clave);

-- buscar_normas devuelve la fila completa de normas con columnas explícitas;
-- se rehace para incluir la columna nueva.
create or replace function public.buscar_normas(
  consulta text,
  filtro_ramas text[] default null,
  desde date default null,
  hasta date default null,
  limite int default 30,
  desplazamiento int default 0
)
returns setof public.normas
language sql
stable
set search_path = public, extensions
as $$
  with q as (
    select websearch_to_tsquery('public.es_sin_tildes', coalesce(consulta, '')) as tsq,
           public.sin_tildes(lower(coalesce(consulta, ''))) as plano
  ),
  filtradas as (
    select n.*
    from public.normas n
    where (filtro_ramas is null or n.ramas && filtro_ramas)
      and (desde is null or n.fecha_publicacion >= desde)
      and (hasta is null or n.fecha_publicacion <= hasta)
  ),
  exactas as (
    select f.*, ts_rank_cd(f.busqueda, q.tsq) as puntaje
    from filtradas f, q
    where q.plano <> '' and f.busqueda @@ q.tsq
  ),
  aproximadas as (
    select f.*, greatest(
             similarity(public.sin_tildes(lower(f.titulo)), q.plano),
             similarity(public.sin_tildes(lower(coalesce(f.numero, ''))), q.plano)
           ) as puntaje
    from filtradas f, q
    where q.plano <> ''
      and not exists (select 1 from exactas)
      and (public.sin_tildes(lower(f.titulo)) % q.plano
           or public.sin_tildes(lower(coalesce(f.numero, ''))) % q.plano)
  ),
  sin_consulta as (
    select f.*, 0::real as puntaje
    from filtradas f, q
    where q.plano = ''
  )
  select id, fuente, id_fuente, tipo, numero, titulo, sumilla, sector,
         fecha_publicacion, edicion_extraordinaria, url_oficial, url_pdf, texto,
         ramas, creado_en, verificado_en, busqueda, clave
  from (
    select * from exactas
    union all select * from aproximadas
    union all select * from sin_consulta
  ) r
  order by puntaje desc, fecha_publicacion desc, id desc
  limit least(greatest(limite, 1), 100)
  offset greatest(desplazamiento, 0)
$$;

create table if not exists public.afectaciones (
  id bigint generated always as identity primary key,
  norma_id bigint not null references public.normas (id) on delete cascade,
  efecto text not null check (efecto in ('deroga', 'modifica', 'deja_sin_efecto')),
  parcial boolean not null default false,
  clave_afectada text not null,
  -- cómo la nombra el título, p. ej. 'Decreto Supremo N° 004-2019-JUS'
  referencia text not null,
  creado_en timestamptz not null default now(),
  unique (norma_id, clave_afectada, efecto)
);
create index if not exists afectaciones_clave_idx on public.afectaciones (clave_afectada);

alter table public.afectaciones enable row level security;
drop policy if exists "afectaciones públicas" on public.afectaciones;
create policy "afectaciones públicas" on public.afectaciones for select using (true);

grant select on public.afectaciones to anon, authenticated;
grant all on public.afectaciones to service_role;
grant all on all sequences in schema public to service_role;
