// Plazos procesales frecuentes. Punto de partida, no sustituto del texto
// vigente: cada uno muestra su base legal y la app pide verificarla. Si una
// norma especial fija otro plazo (Ley 30364, procesos especiales), prevalece.
// Revisión semestral: próxima el 07/04/2027.

export type Forma = 'fisica' | 'electronica' | 'audiencia';

export type Plazo = {
  id: string;
  materia: string;
  acto: string;
  cantidad: number;
  unidad: 'habiles' | 'meses';
  base: string;
  formas: Forma[];
  nota?: string;
};

export const PLAZOS_VERIFICADOS_AL = '2026-10-07';
export const PROXIMA_REVISION = '2027-04-07';

const JUDICIAL: Forma[] = ['electronica', 'fisica', 'audiencia'];
const NOTA_CPP =
  'Se computa desde el día siguiente a la notificación. [[VERIFICAR: art. 143 CPP; algunos plazos (por horas, con detenido) incluyen días inhábiles]]';

export const MATERIAS: { id: string; nombre: string }[] = [
  { id: 'penal', nombre: 'Penal' },
  { id: 'civil', nombre: 'Civil' },
  { id: 'familia', nombre: 'Familia' },
  { id: 'laboral', nombre: 'Laboral' },
  { id: 'constitucional', nombre: 'Constitucional' },
  { id: 'contencioso', nombre: 'Contencioso adm.' },
  { id: 'administrativo', nombre: 'Administrativo' },
];

export const PLAZOS: Plazo[] = [
  // Penal: Código Procesal Penal (D. Leg. 957)
  {
    id: 'penal-apelacion-sentencia',
    materia: 'penal',
    acto: 'Apelación de sentencia',
    cantidad: 5,
    unidad: 'habiles',
    base: 'CPP, art. 414.1.b',
    formas: JUDICIAL,
    nota: NOTA_CPP,
  },
  {
    id: 'penal-apelacion-auto',
    materia: 'penal',
    acto: 'Apelación de auto',
    cantidad: 3,
    unidad: 'habiles',
    base: 'CPP, art. 414.1.c',
    formas: JUDICIAL,
    nota: NOTA_CPP,
  },
  {
    id: 'penal-casacion',
    materia: 'penal',
    acto: 'Casación',
    cantidad: 10,
    unidad: 'habiles',
    base: 'CPP, art. 414.1.a',
    formas: JUDICIAL,
    nota: NOTA_CPP,
  },
  {
    id: 'penal-queja',
    materia: 'penal',
    acto: 'Queja de derecho',
    cantidad: 3,
    unidad: 'habiles',
    base: 'CPP, art. 414.1.c',
    formas: JUDICIAL,
    nota: NOTA_CPP,
  },
  {
    id: 'penal-reposicion',
    materia: 'penal',
    acto: 'Reposición',
    cantidad: 2,
    unidad: 'habiles',
    base: 'CPP, arts. 414.1.d y 415',
    formas: ['electronica', 'fisica'],
    nota: 'Si la resolución se dictó en audiencia, la reposición se plantea y resuelve en el acto (art. 415.2).',
  },
  {
    id: 'penal-inmediato-apelacion',
    materia: 'penal',
    acto: 'Apelación de sentencia en proceso inmediato',
    cantidad: 3,
    unidad: 'habiles',
    base: 'CPP, arts. 414.1.c y 448',
    formas: JUDICIAL,
    nota: NOTA_CPP,
  },
  // Civil: Código Procesal Civil
  {
    id: 'civil-reposicion',
    materia: 'civil',
    acto: 'Reposición',
    cantidad: 3,
    unidad: 'habiles',
    base: 'CPC, art. 363',
    formas: ['electronica', 'fisica'],
    nota: 'Si el decreto se expidió en audiencia, se interpone y resuelve en el acto.',
  },
  {
    id: 'civil-apelacion-auto',
    materia: 'civil',
    acto: 'Apelación de auto (fuera de audiencia)',
    cantidad: 3,
    unidad: 'habiles',
    base: 'CPC, art. 376 (texto según Ley 31591)',
    formas: ['electronica', 'fisica'],
  },
  {
    id: 'civil-apelacion-conocimiento',
    materia: 'civil',
    acto: 'Apelación de sentencia: proceso de conocimiento',
    cantidad: 10,
    unidad: 'habiles',
    base: 'CPC, arts. 373 y 478.13',
    formas: JUDICIAL,
  },
  {
    id: 'civil-apelacion-abreviado',
    materia: 'civil',
    acto: 'Apelación de sentencia: proceso abreviado',
    cantidad: 5,
    unidad: 'habiles',
    base: 'CPC, arts. 373 y 491.12',
    formas: JUDICIAL,
  },
  {
    id: 'civil-apelacion-sumarisimo',
    materia: 'civil',
    acto: 'Apelación de sentencia: proceso sumarísimo',
    cantidad: 3,
    unidad: 'habiles',
    base: 'CPC, art. 556',
    formas: JUDICIAL,
  },
  {
    id: 'civil-casacion',
    materia: 'civil',
    acto: 'Casación',
    cantidad: 10,
    unidad: 'habiles',
    base: 'CPC, art. 391 (texto según Ley 31591)',
    formas: ['electronica', 'fisica'],
    nota: 'Más el término de la distancia, que esta calculadora no suma. [[VERIFICAR: término de la distancia según la sede]]',
  },
  // Familia
  {
    id: 'familia-alimentos-apelacion',
    materia: 'familia',
    acto: 'Apelación de sentencia de alimentos',
    cantidad: 3,
    unidad: 'habiles',
    base: 'CPC, art. 556 (proceso sumarísimo)',
    formas: JUDICIAL,
    nota: 'La apelación se concede sin efecto suspensivo. En violencia familiar rige la Ley 30364 y su reglamento.',
  },
  // Laboral: Nueva Ley Procesal del Trabajo (Ley 29497)
  {
    id: 'laboral-apelacion-sentencia',
    materia: 'laboral',
    acto: 'Apelación de sentencia',
    cantidad: 5,
    unidad: 'habiles',
    base: 'NLPT, art. 32',
    formas: ['audiencia', 'fisica', 'electronica'],
    nota: 'Corre desde el día hábil siguiente a la audiencia de notificación de sentencia o a la fecha en que se citó para ella. Elige "En audiencia" y pon esa fecha.',
  },
  {
    id: 'laboral-casacion',
    materia: 'laboral',
    acto: 'Casación',
    cantidad: 10,
    unidad: 'habiles',
    base: 'NLPT, art. 35 (texto según Ley 31699)',
    formas: ['electronica', 'fisica'],
    nota: 'Más el término de la distancia, que esta calculadora no suma.',
  },
  // Constitucional: Nuevo Código Procesal Constitucional (Ley 31307)
  {
    id: 'const-apelacion',
    materia: 'constitucional',
    acto: 'Apelación de sentencia (amparo, hábeas data, cumplimiento)',
    cantidad: 3,
    unidad: 'habiles',
    base: 'NCPConst, art. 22.b',
    formas: JUDICIAL,
  },
  {
    id: 'const-apelacion-hc',
    materia: 'constitucional',
    acto: 'Apelación de sentencia (hábeas corpus)',
    cantidad: 2,
    unidad: 'habiles',
    base: 'NCPConst, art. 22.a',
    formas: JUDICIAL,
  },
  {
    id: 'const-rac',
    materia: 'constitucional',
    acto: 'Recurso de agravio constitucional',
    cantidad: 10,
    unidad: 'habiles',
    base: 'NCPConst, art. 24',
    formas: ['electronica', 'fisica'],
  },
  {
    id: 'const-queja',
    materia: 'constitucional',
    acto: 'Queja por denegatoria del RAC',
    cantidad: 3,
    unidad: 'habiles',
    base: 'NCPConst, art. 25',
    formas: ['electronica', 'fisica'],
  },
  {
    id: 'const-amparo-resolucion-judicial',
    materia: 'constitucional',
    acto: 'Demanda de amparo contra resolución judicial',
    cantidad: 30,
    unidad: 'habiles',
    base: 'NCPConst, art. 45',
    formas: ['electronica', 'fisica'],
    nota: 'Corre desde la notificación de la resolución que adquiere firmeza. Pon esa fecha.',
  },
  // Contencioso administrativo: TUO de la Ley 27584 (D.S. 011-2019-JUS)
  {
    id: 'contencioso-demanda',
    materia: 'contencioso',
    acto: 'Demanda contra el acto que agota la vía administrativa',
    cantidad: 3,
    unidad: 'meses',
    base: 'TUO Ley 27584, art. 19.1',
    formas: ['fisica'],
    nota: 'Plazo de caducidad. Si vence en día inhábil se corre al siguiente hábil. [[VERIFICAR: supuestos especiales del art. 19]]',
  },
  {
    id: 'contencioso-apelacion',
    materia: 'contencioso',
    acto: 'Apelación de sentencia (proceso ordinario)',
    cantidad: 5,
    unidad: 'habiles',
    base: 'TUO Ley 27584',
    formas: JUDICIAL,
    nota: '[[VERIFICAR: artículo del TUO que fija el plazo]]',
  },
  // Administrativo: TUO de la Ley 27444 (D.S. 004-2019-JUS)
  {
    id: 'adm-reconsideracion',
    materia: 'administrativo',
    acto: 'Recurso de reconsideración',
    cantidad: 15,
    unidad: 'habiles',
    base: 'TUO LPAG, art. 218.2',
    formas: ['fisica'],
    nota: 'Plazo perentorio. Si la notificación fue electrónica, [[VERIFICAR: desde cuándo surte efecto según el art. 20.4 TUO LPAG]]',
  },
  {
    id: 'adm-apelacion',
    materia: 'administrativo',
    acto: 'Recurso de apelación',
    cantidad: 15,
    unidad: 'habiles',
    base: 'TUO LPAG, art. 218.2',
    formas: ['fisica'],
    nota: 'Plazo perentorio. Si la notificación fue electrónica, [[VERIFICAR: desde cuándo surte efecto según el art. 20.4 TUO LPAG]]',
  },
];
