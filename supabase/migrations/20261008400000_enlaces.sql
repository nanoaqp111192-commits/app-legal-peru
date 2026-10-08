-- Enlace entre normas modificadas y las que las modifican.
-- Cada texto compilado de El Peruano guarda las claves de las normas que reúne
-- (p. ej. 'ley 29497'), con la misma forma que normas.clave y
-- afectaciones.clave_afectada, para mostrar qué normas publicadas lo modificaron.

alter table public.compilados add column if not exists claves text[] not null default '{}';
create index if not exists compilados_claves_idx on public.compilados using gin (claves);
