import 'expo-sqlite/localStorage/install';

// Datos que se repiten en todos los escritos; se recuerdan entre modelos.
export const CLAVES_COMPARTIDAS = [
  'recurrente',
  'recurrente_dni',
  'domicilio_procesal',
  'casilla',
  'correo',
  'abogado',
  'colegiatura',
  'lugar',
];

const PREFIJO = 'borrador:';
const COMPARTIDOS = 'datos-compartidos';

function leer(clave: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(clave) ?? '{}');
  } catch {
    return {};
  }
}

function escribir(clave: string, valor: Record<string, string>) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento (p. ej. navegación privada): el borrador solo vive en memoria.
  }
}

export function cargarBorrador(slug: string): Record<string, string> {
  return { ...leer(COMPARTIDOS), ...leer(PREFIJO + slug) };
}

export function guardarBorrador(slug: string, valores: Record<string, string>) {
  escribir(PREFIJO + slug, valores);
  const compartidos = leer(COMPARTIDOS);
  for (const clave of CLAVES_COMPARTIDAS) {
    if (valores[clave]?.trim()) compartidos[clave] = valores[clave];
  }
  escribir(COMPARTIDOS, compartidos);
}

export function borrarBorrador(slug: string) {
  try {
    localStorage.removeItem(PREFIJO + slug);
  } catch {}
}
