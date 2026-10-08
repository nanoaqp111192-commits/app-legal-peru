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
