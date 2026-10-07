-- Jurisprudencia: resoluciones del Tribunal Constitucional (fase 2). La
-- columna `fuente` deja lugar para el Poder Judicial más adelante.

create table public.jurisprudencia (
  id bigint generated always as identity primary key,
  fuente text not null default 'tc',
  -- nombre del archivo publicado, p. ej. '2026/05853-2025-AA' o '2026/04871-2025-AA Desistimiento'
  id_fuente text not null,
  expediente text not null,          -- '05853-2025-AA', como lo lista el TC
  tipo text not null,                -- 'sentencia', 'auto', 'sentencia interlocutoria'
  proceso text,                      -- 'Amparo', 'Hábeas corpus', ...
  numero text,                       -- 'Sentencia 1635/2026'
  colegiado text,
  demandante text,
  demandado text,
  sumilla text,                      -- sección ASUNTO
  fallo text,                        -- sección HA RESUELTO
  texto text,
  fecha_publicacion date not null,
  url_oficial text not null,
  url_pdf text,
  url_html text,
  ramas text[] not null default '{}',
  creado_en timestamptz not null default now(),
  busqueda tsvector generated always as (
    setweight(to_tsvector('public.es_sin_tildes', coalesce(expediente, '') || ' ' || coalesce(numero, '') || ' ' || coalesce(proceso, '')), 'A') ||
    setweight(to_tsvector('public.es_sin_tildes', coalesce(sumilla, '') || ' ' || coalesce(fallo, '')), 'A') ||
    setweight(to_tsvector('public.es_sin_tildes', coalesce(demandante, '') || ' ' || coalesce(demandado, '')), 'B') ||
    setweight(to_tsvector('public.es_sin_tildes', left(coalesce(texto, ''), 200000)), 'C')
  ) stored,
  unique (fuente, id_fuente)
);

create index jurisprudencia_busqueda_idx on public.jurisprudencia using gin (busqueda);
create index jurisprudencia_fecha_idx on public.jurisprudencia (fecha_publicacion desc, id desc);
create index jurisprudencia_expediente_trgm_idx on public.jurisprudencia using gin (public.sin_tildes(expediente) extensions.gin_trgm_ops);

create or replace function public.buscar_jurisprudencia(
  consulta text,
  filtro_procesos text[] default null,
  desde date default null,
  hasta date default null,
  limite int default 30,
  desplazamiento int default 0
)
returns setof public.jurisprudencia
language sql
stable
set search_path = public, extensions
as $$
  with q as (
    select websearch_to_tsquery('public.es_sin_tildes', coalesce(consulta, '')) as tsq,
           public.sin_tildes(lower(coalesce(consulta, ''))) as plano
  ),
  filtradas as (
    select j.*
    from public.jurisprudencia j
    where (filtro_procesos is null or j.proceso = any (filtro_procesos))
      and (desde is null or j.fecha_publicacion >= desde)
      and (hasta is null or j.fecha_publicacion <= hasta)
  ),
  exactas as (
    select f.*, ts_rank_cd(f.busqueda, q.tsq) as puntaje
    from filtradas f, q
    where q.plano <> '' and f.busqueda @@ q.tsq
  ),
  aproximadas as (
    select f.*, similarity(public.sin_tildes(lower(f.expediente)), q.plano) as puntaje
    from filtradas f, q
    where q.plano <> ''
      and not exists (select 1 from exactas)
      and public.sin_tildes(lower(f.expediente)) % q.plano
  ),
  sin_consulta as (
    select f.*, 0::real as puntaje
    from filtradas f, q
    where q.plano = ''
  )
  select id, fuente, id_fuente, expediente, tipo, proceso, numero, colegiado, demandante,
         demandado, sumilla, fallo, texto, fecha_publicacion, url_oficial, url_pdf, url_html,
         ramas, creado_en, busqueda
  from (
    select * from exactas
    union all select * from aproximadas
    union all select * from sin_consulta
  ) r
  order by puntaje desc, fecha_publicacion desc, id desc
  limit least(greatest(limite, 1), 100)
  offset greatest(desplazamiento, 0)
$$;

alter table public.jurisprudencia enable row level security;

create policy "jurisprudencia: lectura pública" on public.jurisprudencia
  for select to anon, authenticated using (true);

grant execute on function public.buscar_jurisprudencia(text, text[], date, date, int, int) to anon, authenticated;
