import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useEscritorio } from '@/hooks/use-escritorio';

/** Lista de tarjetas: una columna en el teléfono, dos en escritorio. */
export function Rejilla({ children }: { children: ReactNode }) {
  const escritorio = useEscritorio();
  if (!escritorio) return <View style={styles.columna}>{children}</View>;
  return (
    <View style={styles.rejilla}>
      {Children.toArray(children).map((hijo, i) => (
        <View key={i} style={styles.celda}>
          {hijo}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  columna: { gap: Spacing.three },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  // Dos por fila descontando el espacio entre ellas; cada tarjeta estira a la altura de la fila.
  celda: { flexBasis: '48%', flexGrow: 1, maxWidth: '50%' },
});
