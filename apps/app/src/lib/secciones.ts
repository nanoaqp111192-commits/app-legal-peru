import type { NombreIcono } from '@/components/icono';

/** Secciones principales, en el orden del menú (pestañas en móvil, menú lateral en web). */
export const SECCIONES: {
  nombre: 'index' | 'buscar' | 'modelos' | 'plazos' | 'alertas';
  href: '/' | '/buscar' | '/modelos' | '/plazos' | '/alertas';
  etiqueta: string;
  descripcion: string;
  icono: NombreIcono;
}[] = [
  {
    nombre: 'index',
    href: '/',
    etiqueta: 'Hoy',
    descripcion: 'El Peruano del día',
    icono: 'hoy',
  },
  {
    nombre: 'buscar',
    href: '/buscar',
    etiqueta: 'Buscar',
    descripcion: 'Normas y jurisprudencia',
    icono: 'buscar',
  },
  {
    nombre: 'modelos',
    href: '/modelos',
    etiqueta: 'Modelos',
    descripcion: 'Escritos para completar',
    icono: 'modelos',
  },
  {
    nombre: 'plazos',
    href: '/plazos',
    etiqueta: 'Plazos',
    descripcion: 'Cómputo en días hábiles',
    icono: 'plazos',
  },
  {
    nombre: 'alertas',
    href: '/alertas',
    etiqueta: 'Alertas',
    descripcion: 'Avisos de normas nuevas',
    icono: 'alertas',
  },
];

/** Sección del menú activa para una ruta; las fichas (norma, resolución...) no marcan ninguna. */
export function seccionDe(ruta: string): string | null {
  if (ruta === '/' || ruta === '') return 'index';
  const primera = ruta.split('/')[1];
  if (primera === 'modelo') return 'modelos';
  return SECCIONES.some((s) => s.nombre === primera) ? primera : null;
}
