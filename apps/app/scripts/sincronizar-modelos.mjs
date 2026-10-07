// Copia contenido/modelos/*.json (fuente única) a src/data/modelos.json, que viaja en la app.
// Uso: npm run modelos        (escribe)
//      npm run modelos -- --comprobar   (falla si la copia está desactualizada; para CI)
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const origen = join(aqui, '../../../contenido/modelos');
const destino = join(aqui, '../src/data/modelos.json');

const modelos = readdirSync(origen)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(origen, f), 'utf8')));
const contenido = `${JSON.stringify(modelos, null, 2)}\n`;

if (process.argv.includes('--comprobar')) {
  const actual = existsSync(destino) ? readFileSync(destino, 'utf8') : '';
  if (actual !== contenido) {
    console.error('src/data/modelos.json está desactualizado: ejecuta `npm run modelos`.');
    process.exit(1);
  }
  console.log(`${modelos.length} modelos sincronizados.`);
} else {
  writeFileSync(destino, contenido);
  console.log(`${modelos.length} modelos copiados a src/data/modelos.json`);
}
