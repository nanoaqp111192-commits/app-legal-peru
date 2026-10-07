// Cómputo de plazos procesales en días hábiles o en meses. Lógica pura, sin
// datos: el calendario de días inhábiles llega como parámetro.

import type { Forma } from '@/data/plazos';

/** Fecha AAAA-MM-DD -> motivo por el que es inhábil (sin fines de semana). */
export type Inhabiles = Map<string, string>;

export type Paso = {
  fecha: string;
  tipo: 'notificacion' | 'computo' | 'inhabil';
  /** Número de día contado (solo en `computo` por días). */
  n?: number;
  detalle?: string;
};

export type Resultado = {
  /** Día en que la notificación surte efecto. */
  efecto: string;
  /** Primer día hábil que cuenta. */
  inicio: string;
  vencimiento: string;
  pasos: Paso[];
};

export type Entrada = {
  notificacion: string;
  forma: Forma;
  cantidad: number;
  unidad: 'habiles' | 'meses';
  inhabiles: Inhabiles;
};

function sumar(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Por qué un día no cuenta, o null si es hábil. */
export function motivoInhabil(fecha: string, inhabiles: Inhabiles): string | null {
  const dia = new Date(`${fecha}T12:00:00Z`).getUTCDay();
  if (dia === 0) return 'Domingo';
  if (dia === 6) return 'Sábado';
  return inhabiles.get(fecha) ?? null;
}

/** Primer día hábil posterior a `fecha`; anota en `pasos` los inhábiles saltados. */
function siguienteHabil(fecha: string, inhabiles: Inhabiles, pasos?: Paso[]): string {
  let actual = sumar(fecha, 1);
  for (let motivo = motivoInhabil(actual, inhabiles); motivo; ) {
    pasos?.push({ fecha: actual, tipo: 'inhabil', detalle: motivo });
    actual = sumar(actual, 1);
    motivo = motivoInhabil(actual, inhabiles);
  }
  return actual;
}

/** Suma meses respetando el fin de mes: 31/01 + 1 mes = 28/02 (o 29). */
export function sumarMeses(fecha: string, meses: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const total = a * 12 + (m - 1) + meses;
  const anio = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return `${anio}-${String(mes).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`;
}

/**
 * Notificación electrónica en casilla del Poder Judicial: surte efecto el
 * segundo día hábil siguiente a su ingreso (TUO LOPJ, art. 155-C) y el plazo
 * corre desde el día hábil siguiente (criterio del TC, Exp. 03180-2021-PA/TC,
 * y de la Corte Suprema, Queja 230-2021-Cajamarca).
 * Notificación física o en audiencia: el plazo corre desde el día siguiente.
 */
export function computar({ notificacion, forma, cantidad, unidad, inhabiles }: Entrada): Resultado {
  const pasos: Paso[] = [];
  let efecto = notificacion;
  if (forma === 'electronica') {
    for (let i = 1; i <= 2; i++) {
      efecto = siguienteHabil(efecto, inhabiles, pasos);
      pasos.push({
        fecha: efecto,
        tipo: 'notificacion',
        detalle:
          i === 1
            ? 'Primer día hábil tras el ingreso a la casilla'
            : 'Surte efecto la notificación',
      });
    }
  }

  if (unidad === 'meses') {
    const inicio = sumar(efecto, 1);
    let vencimiento = sumarMeses(efecto, cantidad);
    const motivo = motivoInhabil(vencimiento, inhabiles);
    if (motivo) {
      pasos.push({
        fecha: vencimiento,
        tipo: 'inhabil',
        detalle: `${motivo}: se corre al siguiente día hábil`,
      });
      vencimiento = siguienteHabil(vencimiento, inhabiles, pasos);
    }
    pasos.push({ fecha: vencimiento, tipo: 'computo', detalle: 'Vence el plazo' });
    return { efecto, inicio, vencimiento, pasos };
  }

  let actual = efecto;
  let inicio = '';
  for (let n = 1; n <= cantidad; n++) {
    actual = siguienteHabil(actual, inhabiles, pasos);
    if (n === 1) inicio = actual;
    pasos.push({
      fecha: actual,
      tipo: 'computo',
      n,
      detalle: n === cantidad ? 'Vence el plazo' : undefined,
    });
  }
  return { efecto, inicio, vencimiento: actual, pasos };
}

export type Estado =
  | { tipo: 'vencido' }
  | { tipo: 'hoy' }
  | { tipo: 'manana' }
  | { tipo: 'vigente'; habilesRestantes: number };

/** Situación del plazo vista desde `hoy`; los días restantes no cuentan hoy. */
export function estadoDelPlazo(hoy: string, vencimiento: string, inhabiles: Inhabiles): Estado {
  if (vencimiento < hoy) return { tipo: 'vencido' };
  if (vencimiento === hoy) return { tipo: 'hoy' };
  let restantes = 0;
  for (let d = sumar(hoy, 1); d <= vencimiento; d = sumar(d, 1)) {
    if (!motivoInhabil(d, inhabiles)) restantes++;
  }
  return restantes <= 1 ? { tipo: 'manana' } : { tipo: 'vigente', habilesRestantes: restantes };
}

/** '07/10/2026' -> '2026-10-07'; null si no es una fecha válida. */
export function leerFecha(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mes, a] = m;
  const iso = `${a}-${mes.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const fecha = new Date(`${iso}T12:00:00Z`);
  return !isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === iso ? iso : null;
}

/** Lista de fechas 'dd/mm/aaaa' separadas por comas, espacios o saltos de línea. */
export function leerFechas(texto: string): { validas: string[]; invalidas: string[] } {
  const partes = texto.split(/[\s,;]+/).filter(Boolean);
  const validas: string[] = [];
  const invalidas: string[] = [];
  for (const p of partes) {
    const f = leerFecha(p);
    if (f) validas.push(f);
    else invalidas.push(p);
  }
  return { validas, invalidas };
}
