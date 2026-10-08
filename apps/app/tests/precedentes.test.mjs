import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CATEGORIAS, buscarPrecedentes } from '../src/lib/precedentes.ts';

const lista = [
  {
    id: 'a',
    categoria: 'pleno_casatorio_civil',
    numero: 'IV Pleno Casatorio Civil',
    expediente: 'Casación 2195-2011-Ucayali',
    pleno: null,
    fecha: '2013-08-14',
    tipo_fecha: 'publicacion',
    tema: 'Ocupante precario: supuestos y alcances',
    url_oficial: null,
    url_verificacion: 'https://ejemplo.pe',
    ramas: ['civil'],
  },
  {
    id: 'b',
    categoria: 'acuerdo_plenario_penal',
    numero: 'Acuerdo Plenario 4-2016/CIJ-116',
    expediente: null,
    pleno: 'X Pleno Jurisdiccional',
    fecha: '2017-10-17',
    tipo_fecha: 'publicacion',
    tema: 'Ámbito típico del delito de colusión',
    url_oficial: null,
    url_verificacion: 'https://ejemplo.pe',
    ramas: ['penal'],
  },
];

test('busca sin tildes, sin importar el orden de las palabras', () => {
  assert.deepEqual(
    buscarPrecedentes(lista, 'precario ocupante').map((p) => p.id),
    ['a'],
  );
  assert.deepEqual(
    buscarPrecedentes(lista, 'AMBITO colusion').map((p) => p.id),
    ['b'],
  );
});

test('los ceros a la izquierda no impiden encontrar el número', () => {
  assert.deepEqual(
    buscarPrecedentes(lista, '04-2016').map((p) => p.id),
    ['b'],
  );
});

test('filtra por categoría y ordena del más reciente al más antiguo', () => {
  assert.deepEqual(
    buscarPrecedentes(lista, '').map((p) => p.id),
    ['b', 'a'],
  );
  assert.deepEqual(
    buscarPrecedentes(lista, '', ['pleno_casatorio_civil']).map((p) => p.id),
    ['a'],
  );
});

test('el catálogo incluido en la app es válido', () => {
  const catalogo = JSON.parse(
    readFileSync(new URL('../src/data/precedentes.json', import.meta.url), 'utf8'),
  );
  assert.ok(catalogo.length > 0);
  const ids = new Set();
  for (const p of catalogo) {
    assert.ok(!ids.has(p.id), `id repetido: ${p.id}`);
    ids.add(p.id);
    assert.ok(p.categoria in CATEGORIAS, `categoría desconocida en ${p.id}`);
    assert.ok(p.numero && p.tema && p.url_verificacion, `faltan datos en ${p.id}`);
    assert.ok(p.fecha === null || /^\d{4}-\d{2}-\d{2}$/.test(p.fecha), `fecha inválida en ${p.id}`);
    for (const u of [p.url_oficial, p.url_verificacion].filter(Boolean)) {
      assert.match(u, /^https:\/\//, `enlace no seguro en ${p.id}`);
    }
  }
});
