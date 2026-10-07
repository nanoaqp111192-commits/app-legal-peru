// Pruebas de la lógica pura (sin React Native). Ejecutar con: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { fechaCorta, fechaLarga, hoyEnLima, sumarDias } from '../src/lib/fechas.ts';
import { camposFaltantes, contarVerificar, rellenar, tramos } from '../src/lib/plantilla.ts';

const campos = [
  { clave: 'juzgado', etiqueta: 'Juzgado', tipo: 'texto', requerido: true },
  { clave: 'via', etiqueta: 'Vía', tipo: 'texto', requerido: true },
  { clave: 'nota', etiqueta: 'Nota', tipo: 'texto', requerido: false },
];
const cuerpo = 'SEÑOR JUEZ DEL {{juzgado}}:\n[[VERIFICAR: plazo según la vía ({{via}})]] {{nota}}';

test('rellenar reemplaza valores y marca los vacíos con su etiqueta', () => {
  assert.equal(
    rellenar(cuerpo, campos, { juzgado: 'PRIMER JUZGADO CIVIL', via: 'abreviado' }),
    'SEÑOR JUEZ DEL PRIMER JUZGADO CIVIL:\n[[VERIFICAR: plazo según la vía (abreviado)]] [Nota]',
  );
});

test('tramos resalta vacíos y marcas, y rellena campos dentro de una marca', () => {
  const t = tramos(cuerpo, campos, { via: 'sumarísimo' });
  assert.deepEqual(
    t.map((x) => x.tipo),
    ['texto', 'vacio', 'texto', 'verificar', 'texto', 'vacio'],
  );
  assert.equal(t[3].texto, '[[VERIFICAR: plazo según la vía (sumarísimo)]]');
});

test('camposFaltantes ignora los opcionales', () => {
  assert.deepEqual(
    camposFaltantes(campos, { juzgado: 'x' }).map((c) => c.clave),
    ['via'],
  );
  assert.equal(contarVerificar(cuerpo), 1);
});

test('fechas en hora de Lima', () => {
  // 02:00 UTC del 8 de octubre son las 21:00 del 7 en Lima.
  assert.equal(hoyEnLima(new Date('2026-10-08T02:00:00Z')), '2026-10-07');
  assert.equal(hoyEnLima(new Date('2026-10-08T05:00:00Z')), '2026-10-08');
  assert.equal(fechaLarga('2026-10-07'), 'miércoles 7 de octubre de 2026');
  assert.equal(fechaCorta('2026-10-07'), '07/10/2026');
  assert.equal(sumarDias('2026-12-30', 3), '2027-01-02');
});

test('cada modelo empaquetado rellena todos sus marcadores', () => {
  const modelos = JSON.parse(readFileSync(new URL('../src/data/modelos.json', import.meta.url)));
  for (const m of modelos) {
    const valores = Object.fromEntries(m.campos.map((c) => [c.clave, 'X']));
    const texto = rellenar(m.cuerpo, m.campos, valores);
    assert.ok(!texto.includes('{{'), `${m.slug}: quedó un marcador sin reemplazar`);
    for (const c of m.campos) assert.ok(!texto.includes(`[${c.etiqueta}]`), `${m.slug}: ${c.clave}`);
  }
});
