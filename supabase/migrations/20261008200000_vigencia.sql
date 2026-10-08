-- Verificación mínima de vigencia. La ingesta lee el título de cada norma nueva y
-- registra qué otras normas declara derogar, modificar o dejar sin efecto. La norma
-- afectada se reconoce por su clave (tipo y número sin tildes, en minúsculas), así
-- que el vínculo funciona aunque la afectada aún no esté cargada.

alter table public.normas add column if not exists clave text;
create index if not exists normas_clave_idx on public.normas (clave);

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
