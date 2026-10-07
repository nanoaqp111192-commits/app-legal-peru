import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCopiaSinConexion } from '@/lib/conexion';
import { fechaCorta } from '@/lib/fechas';
import { modoDemo } from '@/lib/supabase';

export function AvisoDemo() {
  const tema = useTheme();
  if (!modoDemo) return null;
  return (
    <ThemedView style={[styles.caja, { backgroundColor: tema.verificar }]}>
      <ThemedText type="small">
        Modo demostración: las normas y resoluciones que ves son ejemplos, no publicaciones reales.
        Conecta el servidor (ver README) para ver El Peruano del día.
      </ThemedText>
    </ThemedView>
  );
}

export function AvisoSinConexion() {
  const tema = useTheme();
  const copia = useCopiaSinConexion();
  if (!copia) return null;
  // La copia se guardó en UTC; se muestra la hora de Lima (UTC-5).
  const lima = new Date(new Date(copia).getTime() - 5 * 3600 * 1000).toISOString();
  return (
    <ThemedView style={[styles.caja, { backgroundColor: tema.verificar }]}>
      <ThemedText type="small">
        Sin conexión: ves lo guardado en este dispositivo (copia del {fechaCorta(lima.slice(0, 10))}{' '}
        a las {lima.slice(11, 16)}). Puede no incluir lo publicado después.
      </ThemedText>
    </ThemedView>
  );
}

export function Cargando() {
  return <ActivityIndicator style={{ marginTop: Spacing.five }} />;
}

export function MensajeError({ error }: { error: unknown }) {
  const tema = useTheme();
  // Supabase devuelve objetos con `message` que no son instancias de Error.
  const texto =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);
  const sinSenal = /fetch|network|abort|internet/i.test(texto);
  return (
    <ThemedText type="small" style={{ color: tema.vacio }}>
      {sinSenal
        ? 'Sin conexión, y esto no está guardado en el dispositivo. Lo que hayas abierto antes sí se puede ver sin señal.'
        : `No se pudo cargar la información: ${texto}`}
    </ThemedText>
  );
}

export function Vacio({ children }: { children: string }) {
  return (
    <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.four }}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  caja: { padding: Spacing.three, borderRadius: Spacing.three },
});
