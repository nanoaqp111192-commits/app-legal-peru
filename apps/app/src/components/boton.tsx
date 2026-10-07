import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Boton({ etiqueta, alPresionar }: { etiqueta: string; alPresionar: () => void }) {
  const tema = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={alPresionar}
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: tema.accent },
        pressed && { opacity: 0.8 },
      ]}>
      <ThemedText type="smallBold" style={{ color: tema.onAccent }}>
        {etiqueta}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
});
