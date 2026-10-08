import type { Compilado } from './tipos';

// Se repite aquí lo mínimo de ./fechas para que las pruebas con node lo carguen sin
// resolver importaciones sin extensión. Perú usa UTC-5 todo el año.
const DIA_MS = 24 * 60 * 60 * 1000;
const enLima = (t: number) => new Date(t - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);

const plano = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Filtra por título, números o materia; ordena por la última modificación detectada. */
export function filtrarCompilados(lista: Compilado[], consulta: string): Compilado[] {
  const palabras = plano(consulta).split(/\s+/).filter(Boolean);
  return lista
    .filter((c) => {
      const texto = plano(`${c.titulo} ${c.numeros ?? ''} ${c.materia ?? ''}`);
      return palabras.every((p) => texto.includes(p));
    })
    .sort(
      (a, b) =>
        (b.cambiado_en ?? '').localeCompare(a.cambiado_en ?? '') ||
        a.titulo.localeCompare(b.titulo),
    );
}

/** Fecha (AAAA-MM-DD, hora de Lima) de un instante guardado por la base. */
export function diaEnLima(instante: string): string {
  return enLima(new Date(instante).getTime());
}

/** Compilados cuyo PDF cambió en los últimos `dias` días (contando hoy). */
export function cambiosRecientes(lista: Compilado[], dias = 7, ahora = new Date()): Compilado[] {
  const desde = enLima(ahora.getTime() - (dias - 1) * DIA_MS);
  return lista
    .filter((c) => c.cambiado_en && diaEnLima(c.cambiado_en) >= desde)
    .sort((a, b) => (b.cambiado_en ?? '').localeCompare(a.cambiado_en ?? ''));
}
