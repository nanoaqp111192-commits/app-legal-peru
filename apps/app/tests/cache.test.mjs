// Copia local para el modo sin conexión.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { crearCache } from '../src/lib/cache.ts';

function almacenFalso(limite = Infinity) {
  const datos = new Map();
  return {
    datos,
    getItem: (c) => (datos.has(c) ? datos.get(c) : null),
    setItem: (c, v) => {
      const total = [...datos.entries()].reduce((t, [k, x]) => t + (k === c ? 0 : x.length), 0);
      if (total + v.length > limite) throw new Error('QuotaExceededError');
      datos.set(c, v);
    },
    removeItem: (c) => datos.delete(c),
  };
}

test('guarda, lee y lista por prefijo, del más reciente al más antiguo', () => {
  const a = almacenFalso();
  const cache = crearCache(() => a);
  cache.guardar('norma:1', { id: 1 }, new Date('2026-10-07T15:00:00Z'));
  cache.guardar('norma:2', { id: 2 });
  cache.guardar('resolucion:9', { id: 9 });
  assert.deepEqual(cache.leer('norma:1'), {
    guardado: '2026-10-07T15:00:00.000Z',
    valor: { id: 1 },
  });
  assert.deepEqual(cache.todos('norma:'), [{ id: 2 }, { id: 1 }]);
  cache.guardar('norma:1', { id: 1, texto: 'nuevo' });
  assert.deepEqual(cache.todos('norma:')[0], { id: 1, texto: 'nuevo' });
});

test('conserva solo las entradas más recientes', () => {
  const a = almacenFalso();
  const cache = crearCache(() => a, 3);
  for (let i = 1; i <= 5; i++) cache.guardar(`norma:${i}`, i);
  assert.deepEqual(cache.todos('norma:'), [5, 4, 3]);
  assert.equal(a.getItem('cache:norma:1'), null);
});

test('si el almacenamiento se llena, libera las entradas más antiguas', () => {
  const a = almacenFalso(400);
  const cache = crearCache(() => a);
  for (let i = 1; i <= 4; i++) cache.guardar(`n:${i}`, 'x'.repeat(60));
  cache.guardar('n:5', 'y'.repeat(150));
  assert.equal(cache.leer('n:5')?.valor, 'y'.repeat(150));
  assert.equal(cache.leer('n:1'), null);
});

test('sin almacenamiento no falla', () => {
  const cache = crearCache(() => null);
  cache.guardar('x', 1);
  assert.equal(cache.leer('x'), null);
  assert.deepEqual(cache.todos(''), []);
});

test('conRespaldo usa la copia cuando no hay señal y avisa desde cuándo', async () => {
  const a = almacenFalso();
  const cache = crearCache(() => a);
  const avisos = [];
  const avisar = (g) => avisos.push(g);
  assert.equal(await cache.conRespaldo('norma:1', async () => 'en vivo', avisar), 'en vivo');
  const sinSenal = async () => {
    throw new TypeError('Network request failed');
  };
  assert.equal(await cache.conRespaldo('norma:1', sinSenal, avisar), 'en vivo');
  assert.equal(avisos[0], null);
  assert.match(avisos[1], /^\d{4}-\d{2}-\d{2}T/);
  await assert.rejects(cache.conRespaldo('norma:2', sinSenal, avisar), /Network request failed/);
});
