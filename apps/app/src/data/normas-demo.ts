import type { Norma } from '@/lib/tipos';

// Datos de EJEMPLO para el modo demostración (sin servidor). No son normas reales:
// los números terminan en "DEMO" para que nadie los confunda con publicaciones oficiales.
const base = {
  tipo: null,
  sumilla: null,
  edicion_extraordinaria: false,
  url_pdf: null,
  texto: null,
  verificado_en: '2026-10-07T12:00:00Z',
};

export const NORMAS_DEMO: Norma[] = [
  {
    ...base,
    id: 1,
    id_fuente: 'DEMO/1',
    tipo: 'LEY',
    numero: 'LEY N° 00001-DEMO',
    titulo: 'Ley de ejemplo que modifica el Código Penal en materia de extorsión',
    sector: 'CONGRESO DE LA REPUBLICA',
    fecha_publicacion: '2026-10-07',
    url_oficial: 'https://diariooficial.elperuano.pe/Normas',
    ramas: ['penal'],
    texto:
      'Texto de ejemplo. En la versión conectada aquí aparece el texto completo de la norma tomado de El Peruano.',
  },
  {
    ...base,
    id: 2,
    id_fuente: 'DEMO/2',
    tipo: 'DECRETO SUPREMO',
    numero: 'DECRETO SUPREMO N° 000-2026-TR-DEMO',
    titulo:
      'Decreto supremo de ejemplo que modifica el reglamento de seguridad y salud en el trabajo',
    sector: 'TRABAJO Y PROMOCION DEL EMPLEO',
    fecha_publicacion: '2026-10-07',
    url_oficial: 'https://diariooficial.elperuano.pe/Normas',
    ramas: ['laboral'],
  },
  {
    ...base,
    id: 3,
    id_fuente: 'DEMO/3',
    tipo: 'RESOLUCIÓN ADMINISTRATIVA',
    numero: 'RESOLUCIÓN ADMINISTRATIVA N° 000-2026-CE-PJ-DEMO',
    titulo: 'Resolución de ejemplo que aprueba disposiciones sobre notificaciones electrónicas',
    sector: 'PODER JUDICIAL',
    fecha_publicacion: '2026-10-07',
    url_oficial: 'https://diariooficial.elperuano.pe/Normas',
    ramas: ['civil', 'penal'],
  },
  {
    ...base,
    id: 4,
    id_fuente: 'DEMO/4',
    tipo: 'RESOLUCIÓN DE SUPERINTENDENCIA',
    numero: 'RESOLUCIÓN DE SUPERINTENDENCIA N° 000-2026/SUNAT-DEMO',
    titulo: 'Resolución de ejemplo sobre el cronograma de declaraciones del IGV',
    sector: 'SUPERINTENDENCIA NACIONAL DE ADUANAS Y DE ADMINISTRACION TRIBUTARIA',
    fecha_publicacion: '2026-10-07',
    url_oficial: 'https://diariooficial.elperuano.pe/Normas',
    ramas: ['tributario'],
  },
  {
    ...base,
    id: 5,
    id_fuente: 'DEMO/5',
    tipo: 'RESOLUCIÓN MINISTERIAL',
    numero: 'RESOLUCIÓN MINISTERIAL N° 000-2026-MINEDU-DEMO',
    titulo: 'Designan director general (ejemplo)',
    sector: 'EDUCACION',
    fecha_publicacion: '2026-10-07',
    url_oficial: 'https://diariooficial.elperuano.pe/Normas',
    ramas: ['otros'],
  },
];
