import assert from 'node:assert/strict';
import test from 'node:test';

import { cambiosRecientes, diaEnLima, filtrarCompilados } from '../src/lib/compilados.ts';

const c = (id, titulo, cambiado_en = null, extra = {}) => ({
  id,
  id_fuente: id,
  titulo,
  numeros: null,
  materia: 'Laboral',
  url_pdf: 'u',
  verificado_en: null,
  cambiado_en,
  creado_en: '2026-10-08T13:00:00Z',
  ...extra,
});

test('filtra sin tildes por título, números y materia', () => {
  const lista = [
    c(1, 'LEY DE PROTECCIÓN DE DATOS PERSONALES', null, { numeros: 'LEY Nº 29733' }),
    c(2, 'NUEVA LEY PROCESAL DEL TRABAJO', null, { materia: 'Procesal' }),
  ];
  assert.deepEqual(
    filtrarCompilados(lista, 'proteccion 29733').map((x) => x.id),
    [1],
  );
  assert.deepEqual(
    filtrarCompilados(lista, 'procesal').map((x) => x.id),
    [2],
  );
  assert.equal(filtrarCompilados(lista, '').length, 2);
});

test('los cambiados más recientes van primero', () => {
  const lista = [c(1, 'B'), c(2, 'A', '2026-10-01T15:00:00Z'), c(3, 'C', '2026-10-05T15:00:00Z')];
  assert.deepEqual(
    filtrarCompilados(lista, '').map((x) => x.id),
    [3, 2, 1],
  );
});

test('la fecha del cambio es la de Lima', () => {
  // 03:00 UTC del 9 es todavía el 8 en Lima.
  assert.equal(diaEnLima('2026-10-09T03:00:00Z'), '2026-10-08');
});

test('cambios recientes: últimos 7 días contando hoy', () => {
  const ahora = new Date('2026-10-08T17:00:00Z');
  const lista = [c(1, 'x', '2026-10-02T17:00:00Z'), c(2, 'y', '2026-10-01T17:00:00Z'), c(3, 'z')];
  assert.deepEqual(
    cambiosRecientes(lista, 7, ahora).map((x) => x.id),
    [1],
  );
});
