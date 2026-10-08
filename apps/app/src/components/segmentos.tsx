import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Elegir una sola opción (dónde buscar): pestañas subrayadas, distintas de los filtros. */
export function Segmentos<T extends string>({
  opciones,
  valor,
  alCambiar,
}: {
  opciones: { valor: T; etiqueta: string }[];
  valor: T;
  alCambiar: (valor: T) => void;
}) {
  const tema = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.fila, { borderColor: tema.border }]}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            onPress={() => alCambiar(o.valor)}
            style={({ hovered }) => [
              styles.opcion,
              { borderColor: activo ? tema.accent : 'transparent' },
              !activo && hovered && { backgroundColor: tema.backgroundElement },
            ]}>
            <ThemedText
              type={activo ? 'smallBold' : 'small'}
              style={{ color: activo ? tema.accent : tema.textSecondary }}>
              {o.etiqueta}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', borderBottomWidth: 1 },
  opcion: {
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 3,
    marginBottom: -1,
    borderTopLeftRadius: Spacing.two,
    borderTopRightRadius: Spacing.two,
  },
});
