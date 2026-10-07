import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { modoDemo } from '@/lib/supabase';

export function AvisoDemo() {
  const tema = useTheme();
  if (!modoDemo) return null;
  return (
    <ThemedView style={[styles.caja, { backgroundColor: tema.verificar }]}>
      <ThemedText type="small">
        Modo demostración: las normas que ves son ejemplos, no publicaciones reales. Conecta el
        servidor (ver README) para ver El Peruano del día.
      </ThemedText>
    </ThemedView>
  );
}

export function Cargando() {
  return <ActivityIndicator style={{ marginTop: Spacing.five }} />;
}

export function MensajeError({ error }: { error: unknown }) {
  const tema = useTheme();
  const texto = error instanceof Error ? error.message : String(error);
  return (
    <ThemedText type="small" style={{ color: tema.vacio }}>
      No se pudo cargar la información: {texto}
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
