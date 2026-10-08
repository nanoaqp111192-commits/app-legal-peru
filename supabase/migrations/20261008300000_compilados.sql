-- Normas actualizadas de El Peruano: textos compilados que el diario mantiene al
-- día con sus modificaciones (sección "Normas actualizadas"). La ingesta guarda la
-- huella SHA-256 de cada PDF y registra un cambio cuando la huella varía, cuando
-- aparece un compilado nuevo o cuando uno deja de figurar en la lista.

create table if not exists public.compilados (
  id bigint generated always as identity primary key,
  id_fuente int not null unique,          -- IdNorma de El Peruano
  titulo text not null,
  numeros text,                           -- normas que reúne, p. ej. 'LEY N° 29497'
  materia text,
  url_pdf text not null,
  hash text,
  bytes bigint,
  activo boolean not null default true,
  verificado_en timestamptz,
  cambiado_en timestamptz,                -- última vez que se detectó un PDF distinto
  creado_en timestamptz not null default now()
);
create index if not exists compilados_materia_idx on public.compilados (materia);

create table if not exists public.compilados_cambios (
  id bigint generated always as identity primary key,
  compilado_id bigint not null references public.compilados (id) on delete cascade,
  tipo text not null check (tipo in ('nuevo', 'modificado', 'retirado')),
  hash_anterior text,
  hash_nuevo text,
  bytes_anterior bigint,
  bytes_nuevo bigint,
  detectado_en timestamptz not null default now()
);
create index if not exists compilados_cambios_compilado_idx
  on public.compilados_cambios (compilado_id, detectado_en desc);

alter table public.compilados enable row level security;
drop policy if exists "compilados públicos" on public.compilados;
create policy "compilados públicos" on public.compilados for select using (true);
alter table public.compilados_cambios enable row level security;
drop policy if exists "cambios de compilados públicos" on public.compilados_cambios;
create policy "cambios de compilados públicos" on public.compilados_cambios for select using (true);

grant select on public.compilados, public.compilados_cambios to anon, authenticated;
grant all on public.compilados, public.compilados_cambios to service_role;
grant all on all sequences in schema public to service_role;
