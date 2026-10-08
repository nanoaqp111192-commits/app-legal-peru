/**
 * Prepara el texto de una norma para leerlo: repara el texto guardado antes de que la
 * ingesta leyera el visor de El Peruano (misma regla que `limpiar_texto_guardado` en
 * ingesta/ingesta/fuentes/el_peruano.py) y marca secciones, artículos y párrafos.
 */

export type Bloque =
  | { tipo: 'seccion'; texto: string }
  | { tipo: 'articulo'; etiqueta: string; texto: string }
  | { tipo: 'parrafo'; texto: string };

const CABECERA_VISOR = ['PDF', 'HTML', 'Cuadernillo'];
const RE_FECHA = /^\d{2}\/\d{2}\/\d{4}$/;
const RE_CODIGO_CIERRE = /^\d{6,8}-\d{1,2}$/;
const RE_SOLO_PUNTUACION = /^[.\-–—:;,]+$/;
const RE_NUMERAL = /^(\d{1,3}(\.\d{1,3})*|[a-zA-Z]|[ivxlcdmIVXLCDM]{1,6})[.)]$/;

const comparable = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^0-9a-zñ]/g, '');

const unir = (t: string) =>
  t
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+([.,;:)\]])/g, '$1')
    .replace(/([([“"])\s+/g, '$1');

export function limpiarTexto(texto: string, titulo?: string | null): string[] {
  let lineas = texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (CABECERA_VISOR.every((c, i) => lineas[i] === c)) {
    lineas = lineas.slice(3);
    if (/^Fecha de publicaci[oó]n/.test(lineas[0] ?? '')) {
      lineas = lineas.slice(1);
      if (RE_FECHA.test(lineas[0] ?? '')) lineas = lineas.slice(1);
    }
    // Sigue un título ajeno (el <title> del documento incrustado) y la sumilla.
    const objetivo = comparable(titulo ?? '');
    const i = objetivo ? lineas.slice(0, 3).findIndex((l) => comparable(l) === objetivo) : -1;
    lineas = lineas.slice(i >= 0 ? i + 1 : lineas.length > 2 ? 2 : 0);
  }
  while (lineas.length && RE_CODIGO_CIERRE.test(lineas[lineas.length - 1])) lineas.pop();

  const unidas: string[] = [];
  let pegar = false;
  for (const linea of lineas) {
    if (RE_SOLO_PUNTUACION.test(linea) && unidas.length) {
      unidas[unidas.length - 1] += linea;
      pegar = linea.endsWith('-');
      continue;
    }
    if (pegar) {
      unidas[unidas.length - 1] += ` ${linea}`;
      pegar = false;
      continue;
    }
    unidas.push(linea);
    // "1." / "a)" sueltos y encabezados como "Artículo Segundo.-" van con lo que sigue.
    pegar = RE_NUMERAL.test(linea) || (linea.endsWith('.-') && linea.length < 80);
  }

  // La sumilla ya se muestra como título de la ficha.
  const objetivo = comparable(titulo ?? '');
  if (objetivo && unidas.length && comparable(unidas[0]) === objetivo) unidas.shift();
  return unidas.map(unir);
}

const ORDINALES =
  'primera|segunda|tercera|cuarta|quinta|sexta|s[ée]ptima|octava|novena|d[ée]cima[a-zé]*|[úu]nica';
const RE_ARTICULO = new RegExp(
  String.raw`^((?:art[íi]culo|art\.)\s+[^.\-–—]{1,30}?\s*\.?\s*[-–—]+|(?:art[íi]culo|art\.)\s+\d+[º°]?\.|(?:${ORDINALES})(?:\s+[^.\-–—]{1,40}?)?\s*\.?\s*[-–—]+)\s*(.*)$`,
  'i',
);
const RE_SECCION =
  /^(vistos?|considerando|se resuelve|resuelve|se decreta|decreta|por cuanto|por tanto|se acuerda|acuerda|ordena|ha dado la .{1,40}siguiente|t[íi]tulo .{1,80}|cap[íi]tulo .{1,80}|disposici[oó]n(es)? .{1,80}|anexo.{0,80})\s*:?$/i;

const esMayusculas = (t: string) => /[A-ZÁÉÍÓÚÑ]{3}/.test(t) && !/[a-záéíóúñ]/.test(t);

export function bloquesDeTexto(texto: string, titulo?: string | null): Bloque[] {
  return limpiarTexto(texto, titulo).map((linea): Bloque => {
    const articulo = RE_ARTICULO.exec(linea);
    if (articulo && articulo[2])
      return { tipo: 'articulo', etiqueta: articulo[1], texto: articulo[2] };
    if (linea.length < 160 && (RE_SECCION.test(linea) || esMayusculas(linea)))
      return { tipo: 'seccion', texto: linea };
    return { tipo: 'parrafo', texto: linea };
  });
}
