# App Legal Perú

Normas legales del Perú publicadas cada día en El Peruano, clasificadas por rama del
derecho, con búsqueda, alertas y modelos de escritos. Una sola base de código para web,
Android e iOS.

Estado: **fase 1 (MVP)** lista; **fase 2** en curso (calculadora de plazos, jurisprudencia del TC y modo sin conexión listos) del [plan](https://claude.ai/code/artifact/218e4dcd-3ccc-4702-bcab-54c0fd39d8c8).

## Qué hay en este repositorio

| Carpeta | Qué es |
| --- | --- |
| `apps/app` | App en Expo (React Native + web). Pestañas: Hoy, Buscar, Modelos, Plazos, Alertas. |
| `ingesta` | Proceso en Python que trae las normas del día de El Peruano y las resoluciones del Tribunal Constitucional, las clasifica, las guarda y envía los avisos push. |
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

## Sin conexión

Lo que ya se abrió con señal (normas del día, fichas, resoluciones y búsquedas por rama o
proceso) queda guardado en el dispositivo y se puede ver sin internet, con un aviso que
indica la fecha de la copia. Sin señal, la búsqueda por texto filtra lo guardado. Se
conservan las 120 consultas más recientes. Las alertas necesitan conexión.

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

- **Lectura de El Peruano:** validada el 07/10/2026 contra el listado real (95 normas). Si el
  diario cambia su web, el job `fuente-el-peruano` del CI lo detecta; el ajuste va en
  `pedir_listado` o `parsear_listado` de `ingesta/ingesta/fuentes/el_peruano.py`.
- **Modelos en borrador:** los 10 modelos deben ser revisados por un abogado antes de
  publicarse; la app lo indica en cada uno. Las marcas `[[VERIFICAR]]` señalan lo que
  depende del caso o requiere confirmar el texto vigente.
- **Clasificación por reglas:** se basa en el sector y palabras del título. Ya se ajustó con
  las normas reales del 07/10/2026 (actos de personal, ceses, municipalidades), pero seguirá
  habiendo errores que conviene revisar y corregir en `ingesta/ingesta/clasificador.py`.
- **Jurisprudencia del TC:** se lee la página de resoluciones del último día publicado
  (`ingesta/ingesta/fuentes/tribunal_constitucional.py`). El robots.txt del TC pide 30 segundos
  entre pedidos, así que un día completo tarda unos 30 minutos; las resoluciones ya guardadas no
  se vuelven a pedir. Si la GitHub Action no corre algún día, ese día se pierde (la página solo
  muestra el último). Se guardan los nombres de las partes como los publica el TC (que ya
  anonimiza algunos) y se ocultan los DNI del texto.
- **Calculadora de plazos:** es referencial y de alto riesgo (un error puede costar un plazo).
  La tabla de plazos (`apps/app/src/data/plazos.ts`) y el calendario de feriados
  (`apps/app/src/data/calendario.ts`) se revisaron el 07/10/2026; la próxima revisión es el
  07/04/2027. Cada año hay que agregar los feriados (Semana Santa cambia) y los días no
  laborables que decrete el Ejecutivo. No incluye feriados regionales o locales ni el término
  de la distancia; el usuario puede agregarlos como días inhábiles.
- **Íconos y marca:** la app usa todavía los íconos por defecto de Expo.
- **Avisos por correo:** previstos en el plan; hoy solo hay avisos push.
- La app no reemplaza la publicación oficial: cada norma enlaza a El Peruano.
