import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { etiqueta: string; activo?: boolean; alPresionar?: () => void };

export function Chip({ etiqueta, activo, alPresionar }: Props) {
  const tema = useTheme();
  return (
    <Pressable
      accessibilityRole={alPresionar ? 'button' : 'text'}
      accessibilityState={alPresionar ? { selected: !!activo } : undefined}
      onPress={alPresionar}
      disabled={!alPresionar}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: activo ? tema.accent : tema.backgroundElement,
          borderColor: activo ? tema.accent : tema.border,
        },
        pressed && { opacity: 0.7 },
      ]}>
      <ThemedText type="small" style={{ color: activo ? tema.onAccent : tema.text }}>
        {etiqueta}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
    // Los nombres largos (actos procesales) pasan a dos líneas en vez de salirse.
    maxWidth: '100%',
  },
});
