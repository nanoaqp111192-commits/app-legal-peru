-- Esquema inicial de la fase 1: normas, ramas, modelos de escritos y alertas.
-- Las normas y modelos son de lectura pública; las alertas y dispositivos
-- pertenecen a cada usuario. La ingesta escribe con la clave service_role,
-- que no pasa por RLS.

-- En Supabase las extensiones viven en el esquema "extensions".
create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- unaccent() no es IMMUTABLE; este envoltorio permite usarlo en índices
-- y columnas generadas.
create or replace function public.sin_tildes(texto text)
returns text
language sql
immutable
parallel safe
strict
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, texto) $$;

do $$
begin
  if not exists (select 1 from pg_ts_config where cfgname = 'es_sin_tildes') then
    create text search configuration public.es_sin_tildes (copy = pg_catalog.spanish);
    alter text search configuration public.es_sin_tildes
      alter mapping for hword, hword_part, word with extensions.unaccent, spanish_stem;
  end if;
end $$;

-- Ramas del derecho ----------------------------------------------------------

create table public.ramas (
  slug text primary key,
  nombre text not null,
  -- true en las ramas que reciben modelos y cobertura editorial en la fase 1
  profundidad boolean not null default false,
  orden smallint not null default 100
);

insert into public.ramas (slug, nombre, profundidad, orden) values
  ('civil', 'Civil', true, 1),
  ('penal', 'Penal', true, 2),
  ('laboral', 'Laboral', true, 3),
  ('constitucional', 'Constitucional', false, 4),
  ('administrativo', 'Administrativo', false, 5),
  ('tributario', 'Tributario y aduanero', false, 6),
  ('familia', 'Familia', false, 7),
  ('comercial', 'Comercial y societario', false, 8),
  ('registral', 'Registral y notarial', false, 9),
  ('contrataciones', 'Contrataciones del Estado', false, 10),
  ('ambiental', 'Ambiental', false, 11),
  ('consumidor', 'Consumidor y competencia', false, 12),
  ('municipal', 'Municipal y regional', false, 13),
  ('otros', 'Otros', false, 99);

-- Normas ------------------------------------------------------------------

create table public.normas (
  id bigint generated always as identity primary key,
  fuente text not null default 'el_peruano',
  -- identificador estable en la fuente, p. ej. 'NL/2561501-1'
  id_fuente text not null,
  tipo text,
  numero text,
  titulo text not null,
  sumilla text,
  sector text,
  fecha_publicacion date not null,
  edicion_extraordinaria boolean not null default false,
  url_oficial text not null,
  url_pdf text,
  texto text,
  ramas text[] not null default '{}',
  creado_en timestamptz not null default now(),
  -- última vez que la ingesta confirmó la norma contra la fuente oficial
  verificado_en timestamptz not null default now(),
  busqueda tsvector generated always as (
    setweight(to_tsvector('public.es_sin_tildes', coalesce(numero, '') || ' ' || coalesce(tipo, '')), 'A') ||
    setweight(to_tsvector('public.es_sin_tildes', coalesce(titulo, '') || ' ' || coalesce(sumilla, '')), 'A') ||
    setweight(to_tsvector('public.es_sin_tildes', coalesce(sector, '')), 'B') ||
    setweight(to_tsvector('public.es_sin_tildes', left(coalesce(texto, ''), 200000)), 'C')
  ) stored,
  unique (fuente, id_fuente)
);

create index normas_busqueda_idx on public.normas using gin (busqueda);
create index normas_ramas_idx on public.normas using gin (ramas);
create index normas_fecha_idx on public.normas (fecha_publicacion desc, id desc);
create index normas_titulo_trgm_idx on public.normas using gin (public.sin_tildes(titulo) extensions.gin_trgm_ops);
create index normas_numero_trgm_idx on public.normas using gin (public.sin_tildes(coalesce(numero, '')) extensions.gin_trgm_ops);

-- Búsqueda de texto completo con respaldo por similitud (tolera errores de
-- tipeo en números y títulos cuando la búsqueda exacta no encuentra nada).
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
         ramas, creado_en, verificado_en, busqueda
  from (
    select * from exactas
    union all select * from aproximadas
    union all select * from sin_consulta
  ) r
  order by puntaje desc, fecha_publicacion desc, id desc
  limit least(greatest(limite, 1), 100)
  offset greatest(desplazamiento, 0)
$$;

-- Modelos de escritos -----------------------------------------------------

create table public.modelos (
  slug text primary key,
  titulo text not null,
  rama text not null references public.ramas (slug),
  tipo text not null, -- 'judicial', 'fiscal', 'extrajudicial'
  descripcion text not null,
  base_legal text[] not null default '{}',
  -- [{ "clave": "juzgado", "etiqueta": "Juzgado", "ayuda": "...", "tipo": "texto" | "parrafo" | "fecha", "requerido": true }]
  campos jsonb not null default '[]',
  -- cuerpo con marcadores {{clave}} y marcas [[VERIFICAR: ...]]
  cuerpo text not null,
  notas text,
  estado text not null default 'borrador' check (estado in ('borrador', 'revisado')),
  revisado_por text,
  actualizado_en timestamptz not null default now()
);

create index modelos_rama_idx on public.modelos (rama);

-- Alertas -----------------------------------------------------------------

create table public.alertas (
  id bigint generated always as identity primary key,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null default 'Mi alerta',
  ramas text[] not null default '{}',
  palabras_clave text[] not null default '{}',
  sectores text[] not null default '{}',
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  constraint alerta_no_vacia check (
    cardinality(ramas) + cardinality(palabras_clave) + cardinality(sectores) > 0
  )
);

create index alertas_usuario_idx on public.alertas (usuario_id);

create table public.dispositivos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  expo_push_token text not null unique,
  plataforma text not null check (plataforma in ('android', 'ios', 'web')),
  creado_en timestamptz not null default now()
);

create index dispositivos_usuario_idx on public.dispositivos (usuario_id);

-- Registro de avisos enviados, para no notificar dos veces la misma norma.
create table public.envios (
  alerta_id bigint not null references public.alertas (id) on delete cascade,
  norma_id bigint not null references public.normas (id) on delete cascade,
  canal text not null check (canal in ('push', 'correo')),
  enviado_en timestamptz not null default now(),
  primary key (alerta_id, norma_id, canal)
);

-- Seguridad (RLS) -----------------------------------------------------------

alter table public.ramas enable row level security;
alter table public.normas enable row level security;
alter table public.modelos enable row level security;
alter table public.alertas enable row level security;
alter table public.dispositivos enable row level security;
alter table public.envios enable row level security;

create policy "ramas: lectura pública" on public.ramas
  for select to anon, authenticated using (true);

create policy "normas: lectura pública" on public.normas
  for select to anon, authenticated using (true);

create policy "modelos: lectura pública" on public.modelos
  for select to anon, authenticated using (true);

create policy "alertas: solo el dueño" on public.alertas
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "dispositivos: solo el dueño" on public.dispositivos
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- envios no tiene políticas: solo la ingesta (service_role) lo usa.

grant execute on function public.buscar_normas(text, text[], date, date, int, int) to anon, authenticated;
