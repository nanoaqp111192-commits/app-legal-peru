import type { Resolucion } from '@/lib/tipos';

// Datos de EJEMPLO para el modo demostración (sin servidor). No son resoluciones
// reales: los expedientes terminan en "DEMO".
export const RESOLUCIONES_DEMO: Resolucion[] = [
  {
    id: 1,
    id_fuente: 'DEMO/1',
    expediente: '00001-2026-AA-DEMO',
    tipo: 'sentencia',
    proceso: 'Amparo',
    numero: 'Sentencia 1/2026 (ejemplo)',
    colegiado: 'SALA PRIMERA',
    demandante: 'EMPRESA DE EJEMPLO SAC',
    demandado: 'ENTIDAD PÚBLICA DE EJEMPLO',
    sumilla:
      'Recurso de agravio constitucional contra la resolución que declaró improcedente una demanda de amparo sobre una sanción administrativa (ejemplo).',
    fallo: 'Declarar IMPROCEDENTE la demanda.',
    texto:
      'Texto de ejemplo. En la versión conectada aquí aparece el texto completo de la resolución tomado del Tribunal Constitucional.',
    fecha_publicacion: '2026-09-30',
    url_oficial: 'https://www.tc.gob.pe/resolucion/publicadas-en-el-dia/',
    url_pdf: null,
    url_html: null,
  },
  {
    id: 2,
    id_fuente: 'DEMO/2',
    expediente: '00002-2026-HC-DEMO',
    tipo: 'sentencia',
    proceso: 'Hábeas corpus',
    numero: 'Sentencia 2/2026 (ejemplo)',
    colegiado: 'SALA SEGUNDA',
    demandante: 'NOMBRE ANONIMIZADO',
    demandado: 'SALA PENAL DE EJEMPLO',
    sumilla:
      'Recurso de agravio constitucional en un hábeas corpus contra la resolución que confirmó la prisión preventiva (ejemplo).',
    fallo: 'Declarar INFUNDADA la demanda.',
    texto: null,
    fecha_publicacion: '2026-09-30',
    url_oficial: 'https://www.tc.gob.pe/resolucion/publicadas-en-el-dia/',
    url_pdf: null,
    url_html: null,
  },
];

export const PROCESOS_TC = [
  'Amparo',
  'Hábeas corpus',
  'Hábeas data',
  'Cumplimiento',
  'Inconstitucionalidad',
  'Competencial',
  'Queja',
];
