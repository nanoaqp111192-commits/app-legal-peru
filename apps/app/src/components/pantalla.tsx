import { type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoSinConexion } from './avisos';
import { ThemedView } from './themed-view';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type Props = {
  children: ReactNode;
  refrescando?: boolean;
  alRefrescar?: () => void;
  // En las pantallas apiladas (detalle) el encabezado ya respeta el área segura superior.
  conEncabezado?: boolean;
};

export function Pantalla({ children, refrescando, alRefrescar, conEncabezado }: Props) {
  return (
    <ThemedView style={styles.fondo}>
      <SafeAreaView style={styles.fondo} edges={conEncabezado ? ['left', 'right'] : undefined}>
        <ScrollView
          contentContainerStyle={[styles.contenido, !conEncabezado && styles.bajoPestanasWeb]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            alRefrescar ? (
              <RefreshControl refreshing={!!refrescando} onRefresh={alRefrescar} />
            ) : undefined
          }>
          <View style={styles.columna}>
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
  // En web la barra de pestañas flota sobre el contenido.
  bajoPestanasWeb: process.env.EXPO_OS === 'web' ? { paddingTop: 88 } : {},
  columna: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.three },
});
