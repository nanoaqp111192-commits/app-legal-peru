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

-- Vigencia: una norma posterior deroga a otra por su clave
insert into normas (id_fuente, titulo, numero, clave, fecha_publicacion, url_oficial) values
  ('NL/900-1', 'Ley antigua', 'LEY N° 31000', 'ley 31000', '2026-01-10', 'https://x/900'),
  ('NL/901-1', 'Derogan la Ley N° 31000', 'LEY N° 32100', 'ley 32100', '2026-09-01', 'https://x/901');
insert into afectaciones (norma_id, efecto, parcial, clave_afectada, referencia)
  select id, 'deroga', false, 'ley 31000', 'Ley N° 31000' from normas where id_fuente = 'NL/901-1';
do $$ begin
  if (select count(*) from afectaciones a join normas n on n.clave = a.clave_afectada
      where n.id_fuente = 'NL/900-1' and a.efecto = 'deroga') <> 1 then
    raise exception 'la derogación no se vincula a la norma afectada';
  end if;
  begin
    insert into afectaciones (norma_id, efecto, clave_afectada, referencia)
      select id, 'deroga', 'ley 31000', 'x' from normas where id_fuente = 'NL/901-1';
    raise exception 'se aceptó una afectación duplicada';
  exception when unique_violation then null;
  end;
  raise notice 'ok: vigencia';
end $$;
set role anon;
do $$ begin
  if (select count(*) from afectaciones) <> 1 then raise exception 'anon no lee afectaciones'; end if;
end $$;
reset role;

-- Normas actualizadas: un compilado y su historial de cambios
insert into compilados (id_fuente, titulo, materia, url_pdf, hash) values
  (48, 'NUEVA LEY PROCESAL DEL TRABAJO', 'Procesal', 'https://x/48', 'a');
insert into compilados_cambios (compilado_id, tipo, hash_anterior, hash_nuevo)
  select id, 'modificado', 'a', 'b' from compilados where id_fuente = 48;
do $$ begin
  begin
    insert into compilados_cambios (compilado_id, tipo) select id, 'otro' from compilados;
    raise exception 'se aceptó un tipo de cambio inválido';
  exception when check_violation then null;
  end;
  raise notice 'ok: compilados';
end $$;
set role anon;
do $$ begin
  if (select count(*) from compilados_cambios) <> 1 then raise exception 'anon no lee cambios'; end if;
  begin
    insert into compilados (id_fuente, titulo, url_pdf) values (1, 'x', 'x');
    raise exception 'anon pudo escribir compilados';
  exception when insufficient_privilege then raise notice 'ok: anon no escribe compilados';
  end;
end $$;
reset role;

-- Enlaces: un compilado se encuentra por la clave de la norma que reúne
update compilados set claves = array['ley 29497'] where id_fuente = 48;
do $$ begin
  if (select count(*) from compilados where claves @> array['ley 29497']) <> 1 then
    raise exception 'el compilado no se encuentra por su clave';
  end if;
  raise notice 'ok: enlaces de compilados';
end $$;
