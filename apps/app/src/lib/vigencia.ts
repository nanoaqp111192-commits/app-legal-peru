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
