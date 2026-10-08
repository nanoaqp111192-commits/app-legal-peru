import type { Afectacion, Vigencia } from './tipos';

export type EstadoVigencia = 'derogada' | 'sin_efecto' | 'modificada' | 'sin_cambios';

/** El estado más grave que declaran las normas posteriores cargadas. */
export function estadoVigencia(v: Vigencia): EstadoVigencia {
  const total = (e: Afectacion['efecto']) =>
    v.afectadaPor.some((a) => a.efecto === e && !a.parcial);
  if (total('deroga')) return 'derogada';
  if (total('deja_sin_efecto')) return 'sin_efecto';
  return v.afectadaPor.length ? 'modificada' : 'sin_cambios';
}

export const TITULO_ESTADO: Record<EstadoVigencia, string> = {
  derogada: 'Derogada',
  sin_efecto: 'Dejada sin efecto',
  modificada: 'Modificada',
  sin_cambios: 'Sin derogaciones ni modificaciones detectadas',
};

export function verbo(a: Pick<Afectacion, 'efecto' | 'parcial'>): string {
  const base = { deroga: 'Deroga', modifica: 'Modifica', deja_sin_efecto: 'Deja sin efecto' }[
    a.efecto
  ];
  return a.parcial && a.efecto !== 'modifica' ? `${base} en parte` : base;
}

const PALABRAS_MAYUSCULAS = /^[a-z]{2,}$/;

/**
 * 'decreto supremo 004-2019-jus' -> 'Decreto Supremo N° 004-2019-JUS';
 * 'reglamento de ley 29733' -> 'Reglamento de la Ley N° 29733'.
 */
export function nombreClave(clave: string): string {
  const prefijo = clave.match(/^(reglamento|tuo) de (.+)$/);
  if (prefijo) {
    const base = nombreClave(prefijo[2]);
    const de = /^(ley|resolucion)/.test(prefijo[2]) ? 'de la' : 'del';
    return `${prefijo[1] === 'tuo' ? 'TUO' : 'Reglamento'} ${de} ${base}`;
  }
  const partes = clave.split(' ');
  const numero = partes.pop() ?? '';
  const tipo = partes
    .map((p) => (p === 'de' || p === 'la' ? p : p[0].toUpperCase() + p.slice(1)))
    .join(' ')
    .replace(/Resolucion/g, 'Resolución')
    .replace(/Organica/g, 'Orgánica')
    .replace(/Alcaldia/g, 'Alcaldía')
    .replace(/Contraloria/g, 'Contraloría');
  const num = numero
    .split('-')
    .map((p) => (PALABRAS_MAYUSCULAS.test(p) ? p.toUpperCase() : p))
    .join('-');
  return `${tipo} N° ${num}`;
}

/** Afectaciones de la más reciente a la más antigua. */
export function porFecha(lista: Afectacion[]): Afectacion[] {
  return [...lista].sort((a, b) =>
    (b.norma?.fecha_publicacion ?? '').localeCompare(a.norma?.fecha_publicacion ?? ''),
  );
}
