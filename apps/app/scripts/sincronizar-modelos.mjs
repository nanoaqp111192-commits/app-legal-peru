// Copia el contenido curado (fuente única en contenido/) a src/data/, que viaja en la app:
//   contenido/modelos/*.json      -> src/data/modelos.json
//   contenido/precedentes/*.json  -> src/data/precedentes.json
// Uso: npm run modelos        (escribe)
//      npm run modelos -- --comprobar   (falla si la copia está desactualizada; para CI)
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const contenido = join(aqui, '../../../contenido');
const comprobar = process.argv.includes('--comprobar');

function leer(carpeta) {
  return readdirSync(join(contenido, carpeta))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) => JSON.parse(readFileSync(join(contenido, carpeta, f), 'utf8')));
}

let desactualizado = false;
for (const [carpeta, archivo] of [
  ['modelos', 'modelos.json'],
  ['precedentes', 'precedentes.json'],
]) {
  const datos = leer(carpeta);
  const destino = join(aqui, '../src/data', archivo);
  const texto = `${JSON.stringify(datos, null, 2)}\n`;
  if (comprobar) {
    const actual = existsSync(destino) ? readFileSync(destino, 'utf8') : '';
    if (actual !== texto) {
      console.error(`src/data/${archivo} está desactualizado: ejecuta \`npm run modelos\`.`);
      desactualizado = true;
    } else console.log(`${datos.length} elementos de ${carpeta} sincronizados.`);
  } else {
    writeFileSync(destino, texto);
    console.log(`${datos.length} elementos de ${carpeta} copiados a src/data/${archivo}`);
  }
}
if (desactualizado) process.exit(1);
