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

const fallidos = [];
for (let i = 0; i < enlaces.length; i += 6) {
  const lote = enlaces.slice(i, i + 6);
  const estados = await Promise.all(lote.map(estado));
  lote.forEach((u, j) => {
    if (estados[j] !== 200) fallidos.push(`${estados[j]} ${u}`);
  });
}
console.log(`${enlaces.length - fallidos.length} de ${enlaces.length} enlaces responden.`);
for (const f of fallidos) console.log(`  FALLA ${f}`);
if (fallidos.length) process.exit(1);
