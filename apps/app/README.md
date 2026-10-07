# App (Expo)

Web, Android e iOS con Expo Router. Ver el [README principal](../../README.md).

```sh
npm install
npm run web          # navegador
npm run android      # emulador o teléfono con Expo Go
npm run modelos      # copia contenido/modelos a src/data/modelos.json
npm run typecheck && npm run lint && npm test
```

- `src/app`: pantallas (cada archivo es una ruta).
- `src/lib`: acceso a datos (`datos.ts`), relleno de modelos (`plantilla.ts`), fechas en hora de Lima.
- Sin `EXPO_PUBLIC_SUPABASE_URL` la app arranca en modo demostración.
