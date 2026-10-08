import assert from 'node:assert/strict';
import test from 'node:test';

import { bloquesDeTexto, limpiarTexto } from '../src/lib/texto-norma.ts';

const GUARDADO = `PDF
HTML
Cuadernillo
Fecha de publicación:
08/10/2026
Autorizan viaje de Especialista Técnico del OSINERGMIN a Chile
Ordenanza Distrital que aprueba el Comité, Instancia de Coordinación
ORDENANZA N° 014-2026-MDSMM
CONSIDERANDO:
Que, el artículo 194º de la Constitución;
Artículo Sexto
.-
CONSTITUIR al Jefe del Puesto de Salud.
1.
Alcalde Distrital, quien preside.
Artículo Segundo.-
El desplazamiento no irrogará gasto.
Regístrese, comuníquese y cúmplase.
2557156-1`;

const TITULO = 'Ordenanza Distrital que aprueba el Comité Instancia de Coordinación';

test('quita la cabecera de la página y une las líneas partidas', () => {
  assert.deepEqual(limpiarTexto(GUARDADO, TITULO), [
    'ORDENANZA N° 014-2026-MDSMM',
    'CONSIDERANDO:',
    'Que, el artículo 194º de la Constitución;',
    'Artículo Sexto.- CONSTITUIR al Jefe del Puesto de Salud.',
    '1. Alcalde Distrital, quien preside.',
    'Artículo Segundo.- El desplazamiento no irrogará gasto.',
    'Regístrese, comuníquese y cúmplase.',
  ]);
});

test('el texto ya limpio no cambia', () => {
  const limpio = limpiarTexto(GUARDADO, TITULO).join('\n');
  assert.equal(limpiarTexto(limpio, TITULO).join('\n'), limpio);
});

test('reconoce secciones, artículos y párrafos', () => {
  const bloques = bloquesDeTexto(GUARDADO, TITULO);
  assert.deepEqual(bloques[0], { tipo: 'seccion', texto: 'ORDENANZA N° 014-2026-MDSMM' });
  assert.deepEqual(bloques[1], { tipo: 'seccion', texto: 'CONSIDERANDO:' });
  assert.equal(bloques[2].tipo, 'parrafo');
  assert.deepEqual(bloques[3], {
    tipo: 'articulo',
    etiqueta: 'Artículo Sexto.-',
    texto: 'CONSTITUIR al Jefe del Puesto de Salud.',
  });
  assert.deepEqual(bloquesDeTexto('Artículo 1. Objeto de la ley')[0], {
    tipo: 'articulo',
    etiqueta: 'Artículo 1.',
    texto: 'Objeto de la ley',
  });
  assert.deepEqual(bloquesDeTexto('PRIMERA.- Vigencia de la norma')[0], {
    tipo: 'articulo',
    etiqueta: 'PRIMERA.-',
    texto: 'Vigencia de la norma',
  });
});

test('no confunde una mención a un artículo con un encabezado', () => {
  const [b] = bloquesDeTexto('Que, el artículo 194º de la Constitución Política del Perú establece');
  assert.equal(b.tipo, 'parrafo');
});

test('quita la sumilla repetida al inicio del texto ya limpio', () => {
  assert.deepEqual(limpiarTexto('Ley que modifica el Código Penal\nLEY Nº 32999', 'Ley que modifica el Código Penal'), [
    'LEY Nº 32999',
  ]);
});
