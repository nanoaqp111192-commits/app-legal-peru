// Perú usa UTC-5 todo el año (sin horario de verano).
const DESFASE_LIMA_MS = -5 * 60 * 60 * 1000;

/** Fecha de hoy en Lima como AAAA-MM-DD. */
export function hoyEnLima(ahora: Date = new Date()): string {
  return new Date(ahora.getTime() + DESFASE_LIMA_MS).toISOString().slice(0, 10);
}

export function sumarDias(fechaIso: string, dias: number): string {
  const d = new Date(`${fechaIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** '2026-10-07' -> 'miércoles 7 de octubre de 2026' (sin depender de Intl en Android). */
export function fechaLarga(fechaIso: string): string {
  const d = new Date(`${fechaIso}T12:00:00Z`);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** '2026-10-07' -> '07/10/2026', el formato de los escritos. */
export function fechaCorta(fechaIso: string): string {
  const [a, m, d] = fechaIso.split('-');
  return `${d}/${m}/${a}`;
}
