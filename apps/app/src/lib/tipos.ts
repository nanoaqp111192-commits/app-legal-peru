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
