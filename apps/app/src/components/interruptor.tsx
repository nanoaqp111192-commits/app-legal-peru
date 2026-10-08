import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Opción de sí/no con su explicación; toda la fila se puede tocar. */
export function Interruptor({
  etiqueta,
  detalle,
  valor,
  alCambiar,
}: {
  etiqueta: string;
  detalle?: string;
  valor: boolean;
  alCambiar: (valor: boolean) => void;
}) {
  const tema = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: valor }}
      onPress={() => alCambiar(!valor)}
      style={styles.fila}>
      <Switch
        value={valor}
        onValueChange={alCambiar}
        trackColor={{ true: tema.accent, false: tema.border }}
        thumbColor={tema.background}
        {...(process.env.EXPO_OS === 'web' ? { activeThumbColor: tema.background } : {})}
      />
      <View style={styles.textos}>
        <ThemedText type="small">{etiqueta}</ThemedText>
        {detalle ? (
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
            {detalle}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  textos: { flexShrink: 1 },
});
