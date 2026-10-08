import { type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoSinConexion } from './avisos';
import { ThemedView } from './themed-view';

import {
  AnchoAmplio,
  AnchoLectura,
  BottomTabInset,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';
import { useEscritorio } from '@/hooks/use-escritorio';

type Props = {
  children: ReactNode;
  refrescando?: boolean;
  alRefrescar?: () => void;
  // En las pantallas apiladas (detalle) el encabezado ya respeta el área segura superior.
  conEncabezado?: boolean;
  /** Columna angosta para leer textos largos (normas, resoluciones). */
  lectura?: boolean;
};

export function Pantalla({ children, refrescando, alRefrescar, conEncabezado, lectura }: Props) {
  const escritorio = useEscritorio();
  const ancho = !escritorio ? MaxContentWidth : lectura ? AnchoLectura : AnchoAmplio;
  return (
    <ThemedView style={styles.fondo}>
      <SafeAreaView style={styles.fondo} edges={conEncabezado ? ['left', 'right'] : undefined}>
        <ScrollView
          contentContainerStyle={[styles.contenido, escritorio && styles.contenidoEscritorio]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            alRefrescar ? (
              <RefreshControl refreshing={!!refrescando} onRefresh={alRefrescar} />
            ) : undefined
          }>
          <View style={[styles.columna, { maxWidth: ancho }]}>
            <AvisoSinConexion />
            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1 },
  contenido: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  contenidoEscritorio: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
  },
  columna: { width: '100%', alignSelf: 'center', gap: Spacing.three },
});
