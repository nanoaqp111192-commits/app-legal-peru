// Prepara dist/ para Cloudflare Pages después de `expo export --platform web`.
//
// Expo genera una página por ruta; las rutas con parámetro (norma/[id].html) no
// existen como archivo para cada id, así que se copian con un nombre sin corchetes
// y se escribe un _redirects que sirve esa página para cualquier id (la app lee el
// id de la dirección al cargar).
import { copyFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

function paginas(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return nombre.startsWith('(') ? [] : paginas(ruta);
    return nombre.endsWith('.html') ? [ruta] : [];
  });
}

const reglas = [];
for (const ruta of paginas(DIST)) {
  const rel = relative(DIST, ruta);
  const m = rel.match(/^(.+)\/\[(\w+)\]\.html$/);
  if (!m) continue;
  const [, carpeta, parametro] = m;
  const copia = `${carpeta}/_${parametro}_.html`;
  copyFileSync(ruta, join(DIST, copia));
  reglas.push(`/${carpeta}/* /${carpeta}/_${parametro}_ 200`);
}
writeFileSync(join(DIST, '_redirects'), `${reglas.join('\n')}\n`);
console.log(`_redirects con ${reglas.length} rutas:\n${reglas.join('\n')}`);
