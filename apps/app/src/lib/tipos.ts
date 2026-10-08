export type Rama = {
  slug: string;
  nombre: string;
  profundidad: boolean;
};

export type Norma = {
  id: number;
  id_fuente: string;
  tipo: string | null;
  numero: string | null;
  titulo: string;
  sumilla: string | null;
  sector: string | null;
  fecha_publicacion: string; // AAAA-MM-DD
  edicion_extraordinaria: boolean;
  url_oficial: string;
  url_pdf: string | null;
  texto: string | null;
  ramas: string[];
  verificado_en: string;
  clave?: string | null;
};

export type Efecto = 'deroga' | 'modifica' | 'deja_sin_efecto';

/** Lo que el título de una norma declara sobre otra (detección automática). */
export type Afectacion = {
  efecto: Efecto;
  parcial: boolean;
  referencia: string;
  clave_afectada: string;
  norma: Pick<Norma, 'id' | 'numero' | 'titulo' | 'fecha_publicacion'> | null;
};

export type Vigencia = {
  /** Normas posteriores que derogan, modifican o dejan sin efecto a esta. */
  afectadaPor: Afectacion[];
  /** Lo que esta norma declara derogar o modificar. */
  afecta: Afectacion[];
  /** Textos actualizados de El Peruano que incluyen esta norma. */
  compilados?: Pick<Compilado, 'id' | 'titulo'>[];
};

/** Todo lo que se sabe de una norma por su clave, aunque no esté cargada. */
export type Historial = {
  clave: string;
  norma: Pick<Norma, 'id' | 'numero' | 'titulo' | 'fecha_publicacion'> | null;
  compilados: Pick<Compilado, 'id' | 'titulo'>[];
  afectadaPor: Afectacion[];
};

export type CampoModelo = {
  clave: string;
  etiqueta: string;
  tipo: 'texto' | 'parrafo' | 'fecha';
  requerido: boolean;
  ayuda?: string;
};

export type Modelo = {
  slug: string;
  titulo: string;
  rama: string;
  tipo: 'judicial' | 'fiscal' | 'extrajudicial';
  descripcion: string;
  base_legal: string[];
  campos: CampoModelo[];
  cuerpo: string;
  notas: string | null;
  estado: 'borrador' | 'revisado';
};

export type Alerta = {
  id: number;
  nombre: string;
  ramas: string[];
  palabras_clave: string[];
  sectores: string[];
  activa: boolean;
};

export type Resolucion = {
  id: number;
  id_fuente: string;
  expediente: string;
  tipo: string; // 'sentencia' | 'auto' | 'sentencia interlocutoria'
  proceso: string | null;
  numero: string | null;
  colegiado: string | null;
  demandante: string | null;
  demandado: string | null;
  sumilla: string | null;
  fallo: string | null;
  texto: string | null;
  fecha_publicacion: string; // AAAA-MM-DD
  url_oficial: string;
  url_pdf: string | null;
  url_html: string | null;
};

/** Texto compilado de "Normas actualizadas" de El Peruano. */
export type Compilado = {
  id: number;
  id_fuente: number;
  titulo: string;
  numeros: string | null;
  materia: string | null;
  url_pdf: string;
  /** Claves de las normas que reúne, p. ej. 'ley 29497'. */
  claves: string[];
  verificado_en: string | null;
  cambiado_en: string | null;
  creado_en: string;
};
