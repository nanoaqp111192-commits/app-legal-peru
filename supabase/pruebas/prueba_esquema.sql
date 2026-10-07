-- Prueba de la migración: búsqueda, tolerancia a errores y RLS.
\set ON_ERROR_STOP on
set search_path = public, extensions;

insert into normas (id_fuente, tipo, numero, titulo, sumilla, sector, fecha_publicacion, url_oficial, ramas) values
  ('NL/1-1', 'LEY', 'Ley N° 99901', 'Ley que modifica el Código Penal sobre la extorsión', null, 'CONGRESO DE LA REPÚBLICA', '2026-10-06', 'https://x/1', '{penal}'),
  ('NL/2-1', 'DECRETO SUPREMO', 'Decreto Supremo N° 001-2026-TR', 'Decreto Supremo que modifica el reglamento de la jornada de trabajo', null, 'TRABAJO Y PROMOCION DEL EMPLEO', '2026-10-07', 'https://x/2', '{laboral}'),
  ('NL/3-1', 'RESOLUCIÓN ADMINISTRATIVA', 'Resolución Administrativa N° 000300-2026-CE-PJ', 'Aprueban protocolo de notificaciones electrónicas', null, 'PODER JUDICIAL', '2026-10-07', 'https://x/3', '{civil,penal}');

-- 1. Texto completo sin tildes encuentra "Código Penal"
select 'fts', count(*) from buscar_normas('codigo penal');
-- 2. Error de tipeo usa el respaldo por similitud
select 'trgm', titulo from buscar_normas('extorcion codigo penl');
-- 3. Filtro por rama
select 'rama', count(*) from buscar_normas('', array['laboral']);
-- 4. Número de norma
select 'numero', numero from buscar_normas('001-2026-TR');

-- RLS: un usuario solo ve sus alertas; anon no puede escribir normas
insert into auth.users values ('00000000-0000-0000-0000-000000000001', 'a@x'), ('00000000-0000-0000-0000-000000000002', 'b@x');
grant usage on schema public, extensions to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on alertas, dispositivos to authenticated;
grant insert on normas to anon;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
insert into alertas (ramas) values ('{penal}');
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
select 'alertas_de_b', count(*) from alertas;
reset role;
set role anon;
do $$ begin
  insert into normas (id_fuente, titulo, fecha_publicacion, url_oficial) values ('x', 'x', now(), 'x');
  raise exception 'anon pudo escribir normas';
exception when insufficient_privilege then raise notice 'ok: anon no escribe normas';
end $$;
reset role;
-- Alerta vacía rechazada
do $$ begin
  insert into alertas (usuario_id) values ('00000000-0000-0000-0000-000000000001');
  raise exception 'alerta vacía aceptada';
exception when check_violation then raise notice 'ok: alerta vacía rechazada';
end $$;

-- Jurisprudencia del TC
insert into jurisprudencia (id_fuente, expediente, tipo, proceso, numero, colegiado, demandante, demandado, sumilla, fallo, fecha_publicacion, url_oficial) values
  ('2026/05853-2025-AA', '05853-2025-AA', 'sentencia', 'Amparo', 'Sentencia 1635/2026', 'SALA PRIMERA', 'PROTEKTOR SEGURIDAD INTEGRAL SAC', 'OECE', 'Recurso de agravio constitucional contra la resolución que declaró improcedente la demanda de amparo', 'Declarar IMPROCEDENTE la demanda.', '2026-09-30', 'https://x/a'),
  ('2026/05750-2025-HC', '05750-2025-HC', 'sentencia', 'Hábeas corpus', null, 'SALA PRIMERA', 'JIAN FRANCO HUAMAN NAVARRO', 'JUEZ SUPREMO', 'Hábeas corpus contra resolución judicial que confirmó la prisión preventiva', 'Declarar INFUNDADA la demanda.', '2026-09-30', 'https://x/b');
do $$ begin
  if (select count(*) from buscar_jurisprudencia('prision preventiva')) <> 1 then
    raise exception 'búsqueda sin tildes en jurisprudencia falló';
  end if;
  if (select expediente from buscar_jurisprudencia('05853-2025') limit 1) <> '05853-2025-AA' then
    raise exception 'búsqueda por expediente falló';
  end if;
  if (select count(*) from buscar_jurisprudencia('', array['Amparo'])) <> 1 then
    raise exception 'filtro por proceso falló';
  end if;
  raise notice 'ok: búsqueda de jurisprudencia';
end $$;
set role anon;
do $$ begin
  if (select count(*) from jurisprudencia) <> 2 then raise exception 'anon no lee jurisprudencia'; end if;
end $$;
do $$ begin
  insert into jurisprudencia (id_fuente, expediente, tipo, fecha_publicacion, url_oficial) values ('x', 'x', 'auto', now(), 'x');
  raise exception 'anon pudo escribir jurisprudencia';
exception when insufficient_privilege then raise notice 'ok: anon no escribe jurisprudencia';
end $$;
reset role;
