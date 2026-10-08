import type { Rama } from './tipos';

// Copia del catálogo de supabase/migrations: sirve sin conexión y en el modo demo.
export const RAMAS: Rama[] = [
  { slug: 'civil', nombre: 'Civil', profundidad: true },
  { slug: 'penal', nombre: 'Penal', profundidad: true },
  { slug: 'laboral', nombre: 'Laboral', profundidad: true },
  { slug: 'constitucional', nombre: 'Constitucional', profundidad: false },
  { slug: 'administrativo', nombre: 'Administrativo', profundidad: false },
  { slug: 'tributario', nombre: 'Tributario y aduanero', profundidad: false },
  { slug: 'familia', nombre: 'Familia', profundidad: false },
  { slug: 'comercial', nombre: 'Comercial y societario', profundidad: false },
  { slug: 'registral', nombre: 'Registral y notarial', profundidad: false },
  { slug: 'contrataciones', nombre: 'Contrataciones del Estado', profundidad: false },
  { slug: 'ambiental', nombre: 'Ambiental', profundidad: false },
  { slug: 'consumidor', nombre: 'Consumidor y competencia', profundidad: false },
  { slug: 'municipal', nombre: 'Municipal y regional', profundidad: false },
  // No son ramas del derecho: agrupan los actos de personal y lo que no encaja en ninguna.
  { slug: 'personal', nombre: 'Designaciones y viajes', profundidad: false },
  { slug: 'otros', nombre: 'Otros', profundidad: false },
];

/** Categorías que no son ramas del derecho; no se ofrecen en búsquedas ni alertas. */
export const SIN_RAMA = ['personal', 'otros'];

export function nombreRama(slug: string): string {
  return RAMAS.find((r) => r.slug === slug)?.nombre ?? slug;
}
