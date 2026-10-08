// Jurisprudencia vinculante de la Corte Suprema (plenos casatorios, acuerdos plenarios,
// precedentes) y precedentes de observancia obligatoria de tribunales administrativos. Es un catálogo curado y verificado que viaja dentro de la app: se busca sin
// servidor y funciona sin conexión. Lógica pura para poder probarla en Node.

export type Categoria =
  | 'pleno_casatorio_civil'
  | 'pleno_casatorio_penal'
  | 'acuerdo_plenario_penal'
  | 'pleno_laboral'
  | 'pleno_constitucional_contencioso'
  | 'precedente_vinculante'
  | 'precedente_tribunal_fiscal'
  | 'precedente_indecopi'
  | 'precedente_servir'
  | 'acuerdo_tce'
  | 'precedente_sunafil';

/** Corte Suprema o tribunales administrativos: cada uno es una opción en Buscar. */
export type Organo = 'cs' | 'ta';

export type Precedente = {
  id: string;
  categoria: Categoria;
  numero: string;
  expediente: string | null;
  pleno: string | null;
  fecha: string | null; // AAAA-MM-DD
  tipo_fecha: 'publicacion' | 'sentencia' | 'acuerdo' | 'pleno' | null;
  tema: string;
  url_oficial: string | null;
  url_verificacion: string;
  ramas: string[];
};

export const CATEGORIAS: Record<Categoria, string> = {
  pleno_casatorio_civil: 'Pleno casatorio civil',
  pleno_casatorio_penal: 'Pleno casatorio penal',
  acuerdo_plenario_penal: 'Acuerdo plenario penal',
  pleno_laboral: 'Pleno laboral y previsional',
  pleno_constitucional_contencioso: 'Pleno constitucional y contencioso',
  precedente_vinculante: 'Precedente vinculante',
  precedente_tribunal_fiscal: 'Tribunal Fiscal',
  precedente_indecopi: 'Indecopi',
  precedente_servir: 'Tribunal del Servicio Civil',
  acuerdo_tce: 'Tribunal de Contrataciones',
  precedente_sunafil: 'Tribunal de Fiscalización Laboral',
};

export const ORGANOS: Record<Organo, string> = {
  cs: 'Corte Suprema',
  ta: 'Tribunales administrativos',
};

const ADMINISTRATIVOS: Categoria[] = [
  'precedente_tribunal_fiscal',
  'precedente_indecopi',
  'precedente_servir',
  'acuerdo_tce',
  'precedente_sunafil',
];

export function organo(c: Categoria): Organo {
  return ADMINISTRATIVOS.includes(c) ? 'ta' : 'cs';
}

export function categoriasDe(o: Organo): Categoria[] {
  return (Object.keys(CATEGORIAS) as Categoria[]).filter((c) => organo(c) === o);
}

export const ETIQUETA_FECHA: Record<NonNullable<Precedente['tipo_fecha']>, string> = {
  publicacion: 'Publicado en El Peruano',
  sentencia: 'Sentencia del',
  acuerdo: 'Acuerdo del',
  pleno: 'Pleno del',
};

function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Quita ceros a la izquierda para que "04-2016" y "4-2016" coincidan. */
function normalizar(texto: string): string {
  return sinTildes(texto).replace(/\b0+(\d)/g, '$1');
}

/**
 * Filtra por categorías y por texto: cada palabra de la consulta debe aparecer en el número,
 * expediente, pleno o tema (sin importar tildes ni mayúsculas). Más recientes primero.
 */
export function buscarPrecedentes(
  lista: Precedente[],
  consulta: string,
  categorias: Categoria[] = [],
  de?: Organo,
): Precedente[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  return lista
    .filter((p) => !de || organo(p.categoria) === de)
    .filter((p) => !categorias.length || categorias.includes(p.categoria))
    .filter((p) => {
      if (!palabras.length) return true;
      const texto = normalizar(
        `${p.numero} ${p.expediente ?? ''} ${p.pleno ?? ''} ${p.tema} ${CATEGORIAS[p.categoria]}`,
      );
      return palabras.every((w) => texto.includes(w));
    })
    .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
}
