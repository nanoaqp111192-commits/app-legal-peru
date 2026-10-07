# App Legal Perú

Normas legales del Perú publicadas cada día en El Peruano, clasificadas por rama del
derecho, con búsqueda, alertas y modelos de escritos. Una sola base de código para web,
Android e iOS.

Estado: **fase 1 (MVP)** del [plan](https://claude.ai/code/artifact/218e4dcd-3ccc-4702-bcab-54c0fd39d8c8).

## Qué hay en este repositorio

| Carpeta | Qué es |
| --- | --- |
| `apps/app` | App en Expo (React Native + web). Pestañas: Hoy, Buscar, Modelos, Alertas. |
| `ingesta` | Proceso en Python que trae las normas del día de El Peruano, las clasifica por rama, las guarda y envía los avisos push. |
| `supabase/migrations` | Esquema de la base de datos (PostgreSQL en Supabase) con búsqueda de texto completo y seguridad por filas. |
| `contenido/modelos` | Modelos de escritos (JSON). Fuente única: la app y la base de datos se alimentan de aquí. |
| `.github/workflows` | Pruebas en cada cambio (`ci.yml`) e ingesta programada dos veces al día (`ingesta.yml`). |

## Probar la app sin servidor

```sh
cd apps/app
npm install
npm run web        # o: npm run android
```

Sin variables de entorno arranca en **modo demostración**, con normas de ejemplo
marcadas como tales. Los modelos de escritos funcionan completos sin conexión.

## Poner en marcha el servidor

1. Crea un proyecto en [Supabase](https://supabase.com) (el plan gratuito alcanza para el MVP).
2. Aplica el esquema: `supabase link` y `supabase db push`, o pega
   `supabase/migrations/20261007000000_inicial.sql` en el editor SQL.
3. En Authentication, deja activo el ingreso por correo (código de un solo uso).
4. En GitHub, agrega los secretos `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
   (Settings > Secrets and variables > Actions). Con eso la ingesta corre sola.
5. Carga los modelos: `cd ingesta && pip install -e . && python -m ingesta modelos`.
6. En `apps/app`, copia `.env.example` a `.env` con la URL y la clave publicable.

## Avisos push en Android e iOS

Necesitan una build propia (no Expo Go) y un proyecto de EAS:
`npx eas-cli@latest init` y `npx eas-cli@latest build -p android`. Para Android hay que
subir las credenciales de Firebase Cloud Messaging a EAS. La cuenta de Google Play cuesta
USD 25 (pago único) y la de Apple USD 99 al año.

## Pruebas

```sh
cd ingesta && pip install -e ".[dev]" && pytest && ruff check .
cd apps/app && npm run typecheck && npm run lint && npm test
```

La migración se prueba en CI sobre un PostgreSQL limpio (`supabase/pruebas`).

## Pendiente y riesgos conocidos

- **Listado de El Peruano sin validar:** el entorno donde se construyó no podía conectarse a
  elperuano.pe. El lector se probó con HTML de muestra; la primera corrida de
  `ingesta.yml` (se puede lanzar a mano en modo seco) confirma si la URL del listado es
  correcta. Si cambia, solo hay que ajustar `pedir_listado` en
  `ingesta/ingesta/fuentes/el_peruano.py`.
- **Modelos en borrador:** los 10 modelos deben ser revisados por un abogado antes de
  publicarse; la app lo indica en cada uno. Las marcas `[[VERIFICAR]]` señalan lo que
  depende del caso o requiere confirmar el texto vigente.
- **Clasificación por reglas:** se basa en el sector y palabras del título; habrá aciertos
  y errores que conviene revisar con normas reales y ajustar en `ingesta/clasificador.py`.
- **Íconos y marca:** la app usa todavía los íconos por defecto de Expo.
- **Avisos por correo:** previstos en el plan; hoy solo hay avisos push.
- La app no reemplaza la publicación oficial: cada norma enlaza a El Peruano.
