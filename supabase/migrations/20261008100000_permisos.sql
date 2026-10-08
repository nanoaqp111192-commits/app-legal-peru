-- Permisos explícitos sobre las tablas. Supabase los concedía por defecto, pero los proyectos
-- nuevos pueden no hacerlo; declararlos aquí deja la base igual en cualquier caso.
-- Las políticas de seguridad por filas (RLS) siguen decidiendo qué filas ve cada quien.

grant usage on schema public to anon, authenticated, service_role;

-- Lectura pública.
grant select on public.ramas, public.normas, public.modelos, public.jurisprudencia
  to anon, authenticated;

-- Datos de cada usuario (las políticas limitan a sus propias filas).
grant select, insert, update, delete on public.alertas, public.dispositivos to authenticated;

-- La ingesta usa la clave secreta (service_role), que no pasa por RLS.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant usage on all sequences in schema public to authenticated;
