import assert from 'node:assert/strict';
import test from 'node:test';

import { estadoVigencia, verbo } from '../src/lib/vigencia.ts';

const a = (efecto, parcial = false) => ({
  efecto,
  parcial,
  referencia: 'x',
  clave_afectada: 'x',
  norma: null,
});

test('una derogación total manda sobre una modificación', () => {
  assert.equal(
    estadoVigencia({ afectadaPor: [a('modifica', true), a('deroga')], afecta: [] }),
    'derogada',
  );
});

test('una derogación parcial cuenta como modificación', () => {
  assert.equal(estadoVigencia({ afectadaPor: [a('deroga', true)], afecta: [] }), 'modificada');
  assert.equal(verbo(a('deroga', true)), 'Deroga en parte');
});

test('sin afectaciones no se afirma vigencia, solo que no se detectaron cambios', () => {
  assert.equal(estadoVigencia({ afectadaPor: [], afecta: [] }), 'sin_cambios');
  assert.equal(estadoVigencia({ afectadaPor: [a('deja_sin_efecto')], afecta: [] }), 'sin_efecto');
});

test('nombre legible de una clave', async () => {
  const { nombreClave } = await import('../src/lib/vigencia.ts');
  assert.equal(nombreClave('ley 29497'), 'Ley N° 29497');
  assert.equal(nombreClave('decreto supremo 004-2019-jus'), 'Decreto Supremo N° 004-2019-JUS');
  assert.equal(nombreClave('reglamento de ley 29733'), 'Reglamento de la Ley N° 29733');
  assert.equal(
    nombreClave('tuo de decreto legislativo 816'),
    'TUO de el Decreto Legislativo N° 816'.replace('de el', 'del'),
  );
  assert.equal(
    nombreClave('resolucion de superintendencia 007-99-sunat'),
    'Resolución de Superintendencia N° 007-99-SUNAT',
  );
});

test('modificaciones de la más reciente a la más antigua', async () => {
  const { porFecha } = await import('../src/lib/vigencia.ts');
  const m = (id, fecha) => ({
    ...a('modifica'),
    norma: { id, numero: null, titulo: 't', fecha_publicacion: fecha },
  });
  assert.deepEqual(
    porFecha([m(1, '2026-01-05'), m(2, '2026-09-01')]).map((x) => x.norma.id),
    [2, 1],
  );
});
