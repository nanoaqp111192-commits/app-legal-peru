// Comprueba que los enlaces del catálogo de precedentes respondan. Se ejecuta en CI (los
// sitios del Estado no son accesibles desde todos los entornos) y no bloquea el PR.
// Uso: node scripts/comprobar-enlaces.mjs
import { readFileSync } from 'node:fs';

const catalogo = JSON.parse(
  readFileSync(new URL('../src/data/precedentes.json', import.meta.url), 'utf8'),
);
const enlaces = [...new Set(catalogo.flatMap((p) => [p.url_oficial, p.url_verificacion]))].filter(
  Boolean,
);
const cabeceras = { 'User-Agent': 'Mozilla/5.0 (app-legal-peru; comprobación de enlaces)' };

async function estado(url) {
  for (let intento = 0; intento < 2; intento++) {
    try {
      const r = await fetch(url, {
        headers: cabeceras,
        redirect: 'follow',
        signal: AbortSignal.timeout(30_000),
      });
      await r.body?.cancel();
      if (r.ok || intento === 1) return r.status;
    } catch (e) {
      if (intento === 1) return e.name;
    }
  }
}

// Solo "no existe" (404/410) es un enlace roto. Muchos sitios rechazan a los robots (403,
// 202 con desafío, 429) o cortan la conexión; esos se listan para revisar a mano.
const rotos = [];
const dudosos = [];
for (let i = 0; i < enlaces.length; i += 6) {
  const lote = enlaces.slice(i, i + 6);
  const estados = await Promise.all(lote.map(estado));
  lote.forEach((u, j) => {
    if (estados[j] === 404 || estados[j] === 410) rotos.push(`${estados[j]} ${u}`);
    else if (estados[j] !== 200) dudosos.push(`${estados[j]} ${u}`);
  });
}
const ok = enlaces.length - rotos.length - dudosos.length;
console.log(`${ok} de ${enlaces.length} enlaces responden.`);
for (const d of dudosos) console.log(`  NO VERIFICABLE (revisar a mano) ${d}`);
for (const r of rotos) console.log(`  ROTO ${r}`);
if (rotos.length) process.exit(1);
