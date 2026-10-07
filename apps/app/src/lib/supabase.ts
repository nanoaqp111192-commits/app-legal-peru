import 'expo-sqlite/localStorage/install';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const clave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** null cuando no hay credenciales: la app funciona en modo demostración. */
export const supabase: SupabaseClient | null =
  url && clave
    ? createClient(url, clave, {
        auth: {
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const modoDemo = supabase === null;
