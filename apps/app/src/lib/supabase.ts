import 'expo-sqlite/localStorage/install';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const clave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Con señal débil (p. ej. en una sala de audiencias) conviene pasar rápido a la copia local
// en vez de esperar: sin reintentos automáticos y con un límite de tiempo por pedido.
const TIEMPO_MAXIMO_MS = 10_000;

function fetchConLimite(entrada: RequestInfo | URL, opciones?: RequestInit) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);
  opciones?.signal?.addEventListener('abort', () => controlador.abort());
  return fetch(entrada, { ...opciones, signal: controlador.signal }).finally(() =>
    clearTimeout(temporizador),
  );
}

/** null cuando no hay credenciales: la app funciona en modo demostración. */
export const supabase: SupabaseClient | null =
  url && clave
    ? createClient(url, clave, {
        auth: {
          // Al generar las páginas web estáticas (Node) no existe localStorage.
          storage: typeof localStorage === 'undefined' ? undefined : localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        db: { retry: false },
        global: { fetch: fetchConLimite },
      })
    : null;

export const modoDemo = supabase === null;
