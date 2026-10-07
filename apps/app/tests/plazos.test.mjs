// Cómputo de plazos. Calendario de referencia: el 08/10/2026 es feriado (Combate de Angamos).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ANIOS_CUBIERTOS, FERIADOS, NO_LABORABLES } from '../src/data/calendario.ts';
import { MATERIAS, PLAZOS } from '../src/data/plazos.ts';
import {
  computar,
  estadoDelPlazo,
  leerFecha,
  leerFechas,
  motivoInhabil,
  sumarMeses,
} from '../src/lib/plazos.ts';

const feriados = new Map(FERIADOS.map((f) => [f.fecha, f.motivo]));

test('el calendario tiene 16 feriados por año cubierto y el 8 de octubre de 2026', () => {
  for (const anio of ANIOS_CUBIERTOS) {
    assert.equal(FERIADOS.filter((f) => f.fecha.startsWith(`${anio}-`)).length, 16);
  }
  assert.equal(motivoInhabil('2026-10-08', feriados), 'Combate de Angamos');
  assert.equal(motivoInhabil('2026-10-10', feriados), 'Sábado');
  assert.equal(motivoInhabil('2026-10-07', feriados), null);
  assert.ok(NO_LABORABLES.every((d) => d.fuente));
});

test('notificación física: corre desde el día siguiente y salta el feriado', () => {
  const r = computar({
    notificacion: '2026-10-07',
    forma: 'fisica',
    cantidad: 3,
    unidad: 'habiles',
    inhabiles: feriados,
  });
  assert.equal(r.efecto, '2026-10-07');
  assert.equal(r.inicio, '2026-10-09');
  assert.equal(r.vencimiento, '2026-10-13');
  assert.deepEqual(
    r.pasos.map((p) => [p.fecha, p.tipo]),
    [
      ['2026-10-08', 'inhabil'],
      ['2026-10-09', 'computo'],
      ['2026-10-10', 'inhabil'],
      ['2026-10-11', 'inhabil'],
      ['2026-10-12', 'computo'],
      ['2026-10-13', 'computo'],
    ],
  );
});

test('casilla electrónica: surte efecto al segundo día hábil y corre desde el siguiente', () => {
  const r = computar({
    notificacion: '2026-10-07',
    forma: 'electronica',
    cantidad: 5,
    unidad: 'habiles',
    inhabiles: feriados,
  });
  assert.equal(r.efecto, '2026-10-12');
  assert.equal(r.inicio, '2026-10-13');
  assert.equal(r.vencimiento, '2026-10-19');
});

test('notificación electrónica en sábado: cuentan lunes y martes', () => {
  const r = computar({
    notificacion: '2026-10-17',
    forma: 'electronica',
    cantidad: 1,
    unidad: 'habiles',
    inhabiles: feriados,
  });
  assert.equal(r.efecto, '2026-10-20');
  assert.equal(r.vencimiento, '2026-10-21');
});

test('un día no laborable incluido corre el vencimiento', () => {
  const base = { notificacion: '2026-07-21', forma: 'fisica', cantidad: 3, unidad: 'habiles' };
  assert.equal(computar({ ...base, inhabiles: feriados }).vencimiento, '2026-07-27');
  const conNoLaborables = new Map([...feriados, ...NO_LABORABLES.map((d) => [d.fecha, d.motivo])]);
  assert.equal(computar({ ...base, inhabiles: conNoLaborables }).vencimiento, '2026-07-30');
});

test('plazo en meses: mismo día del mes y, si es inhábil, el siguiente hábil', () => {
  assert.equal(sumarMeses('2026-01-31', 1), '2026-02-28');
  assert.equal(sumarMeses('2026-11-30', 3), '2027-02-28');
  const r = computar({
    notificacion: '2026-11-30',
    forma: 'fisica',
    cantidad: 3,
    unidad: 'meses',
    inhabiles: feriados,
  });
  assert.equal(r.vencimiento, '2027-03-01');
});

test('estado del plazo visto desde hoy', () => {
  assert.deepEqual(estadoDelPlazo('2026-10-07', '2026-10-06', feriados), { tipo: 'vencido' });
  assert.deepEqual(estadoDelPlazo('2026-10-07', '2026-10-07', feriados), { tipo: 'hoy' });
  // El 8 es feriado: el 9 es el próximo día hábil.
  assert.deepEqual(estadoDelPlazo('2026-10-07', '2026-10-09', feriados), { tipo: 'manana' });
  assert.deepEqual(estadoDelPlazo('2026-10-07', '2026-10-13', feriados), {
    tipo: 'vigente',
    habilesRestantes: 3,
  });
});

test('lectura de fechas dd/mm/aaaa', () => {
  assert.equal(leerFecha('7/10/2026'), '2026-10-07');
  assert.equal(leerFecha('31/02/2026'), null);
  assert.equal(leerFecha('2026-10-07'), null);
  assert.deepEqual(leerFechas('15/10/2026, 16/10/2026\nhola'), {
    validas: ['2026-10-15', '2026-10-16'],
    invalidas: ['hola'],
  });
});

test('la tabla de plazos es consistente', () => {
  const materias = new Set(MATERIAS.map((m) => m.id));
  const ids = new Set();
  for (const p of PLAZOS) {
    assert.ok(materias.has(p.materia), p.id);
    assert.ok(!ids.has(p.id), `id repetido ${p.id}`);
    ids.add(p.id);
    assert.ok(p.cantidad > 0 && p.base && p.formas.length, p.id);
  }
  for (const m of materias)
    assert.ok(
      PLAZOS.some((p) => p.materia === m),
      m,
    );
});
