// Días inhábiles nacionales para el cómputo de plazos. Sábados y domingos se
// descartan aparte. Fuente de los feriados: D. Leg. 713 y leyes que agregaron
// el 7 de junio, el 23 de julio, el 6 de agosto, el 8 y el 9 de diciembre.
// Los días no laborables del sector público se listan aparte porque el Poder
// Judicial o la entidad deben acogerse a cada uno (ver `NO_LABORABLES`).
//
// Al agregar un año: sumar sus feriados (Jueves y Viernes Santo cambian),
// los días no laborables decretados y actualizar `ANIOS_CUBIERTOS`.

export type DiaInhabil = { fecha: string; motivo: string; fuente?: string };

export const ANIOS_CUBIERTOS = [2026, 2027];
export const CALENDARIO_VERIFICADO_AL = '2026-10-07';

const FIJOS: [string, string][] = [
  ['01-01', 'Año Nuevo'],
  ['05-01', 'Día del Trabajo'],
  ['06-07', 'Batalla de Arica y Día de la Bandera'],
  ['06-29', 'San Pedro y San Pablo'],
  ['07-23', 'Día de la Fuerza Aérea del Perú'],
  ['07-28', 'Fiestas Patrias'],
  ['07-29', 'Fiestas Patrias'],
  ['08-06', 'Batalla de Junín'],
  ['08-30', 'Santa Rosa de Lima'],
  ['10-08', 'Combate de Angamos'],
  ['11-01', 'Día de Todos los Santos'],
  ['12-08', 'Inmaculada Concepción'],
  ['12-09', 'Batalla de Ayacucho'],
  ['12-25', 'Navidad'],
];

const SEMANA_SANTA: Record<number, [string, string]> = {
  2026: ['2026-04-02', '2026-04-03'],
  2027: ['2027-03-25', '2027-03-26'],
};

export const FERIADOS: DiaInhabil[] = ANIOS_CUBIERTOS.flatMap((anio) => [
  ...FIJOS.map(([md, motivo]) => ({ fecha: `${anio}-${md}`, motivo })),
  { fecha: SEMANA_SANTA[anio][0], motivo: 'Jueves Santo' },
  { fecha: SEMANA_SANTA[anio][1], motivo: 'Viernes Santo' },
]).sort((a, b) => a.fecha.localeCompare(b.fecha));

export const NO_LABORABLES: DiaInhabil[] = [
  {
    fecha: '2026-01-02',
    motivo: 'Día no laborable del sector público',
    fuente: 'D.S. 042-2025-PCM',
  },
  {
    fecha: '2026-07-27',
    motivo: 'Día no laborable del sector público',
    fuente: 'D.S. 075-2026-PCM',
  },
];
