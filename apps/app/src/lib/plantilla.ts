import type { CampoModelo } from './tipos';

const MARCADOR = /\{\{\s*([a-z0-9_]+)\s*\}\}/g;
export const MARCA_VERIFICAR = /\[\[VERIFICAR[^\]]*\]\]/g;

export type Tramo = { texto: string; tipo: 'texto' | 'vacio' | 'verificar' };

/** Reemplaza {{clave}} por su valor; los vacíos quedan como [etiqueta]. */
export function rellenar(
  cuerpo: string,
  campos: CampoModelo[],
  valores: Record<string, string>,
): string {
  return cuerpo.replace(MARCADOR, (_, clave: string) => {
    const valor = valores[clave]?.trim();
    if (valor) return valor;
    const etiqueta = campos.find((c) => c.clave === clave)?.etiqueta ?? clave;
    return `[${etiqueta}]`;
  });
}

/** Divide el texto para resaltar campos vacíos y marcas [[VERIFICAR]] en la vista previa. */
export function tramos(
  cuerpo: string,
  campos: CampoModelo[],
  valores: Record<string, string>,
): Tramo[] {
  const resultado: Tramo[] = [];
  const patron = new RegExp(`${MARCADOR.source}|${MARCA_VERIFICAR.source}`, 'g');
  let ultimo = 0;
  for (const m of cuerpo.matchAll(patron)) {
    const inicio = m.index ?? 0;
    if (inicio > ultimo) resultado.push({ texto: cuerpo.slice(ultimo, inicio), tipo: 'texto' });
    if (m[1]) {
      const valor = valores[m[1]]?.trim();
      const etiqueta = campos.find((c) => c.clave === m[1])?.etiqueta ?? m[1];
      resultado.push(
        valor ? { texto: valor, tipo: 'texto' } : { texto: `[${etiqueta}]`, tipo: 'vacio' },
      );
    } else {
      // Una marca puede citar un campo, p. ej. [[VERIFICAR: plazo según la vía ({{via}})]].
      resultado.push({ texto: rellenar(m[0], campos, valores), tipo: 'verificar' });
    }
    ultimo = inicio + m[0].length;
  }
  if (ultimo < cuerpo.length) resultado.push({ texto: cuerpo.slice(ultimo), tipo: 'texto' });
  return resultado;
}

export function camposFaltantes(
  campos: CampoModelo[],
  valores: Record<string, string>,
): CampoModelo[] {
  return campos.filter((c) => c.requerido && !valores[c.clave]?.trim());
}

export function contarVerificar(texto: string): number {
  return texto.match(MARCA_VERIFICAR)?.length ?? 0;
}
