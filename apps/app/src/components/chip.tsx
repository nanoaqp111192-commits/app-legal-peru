import { Pressable, StyleSheet } from 'react-native';

import { Icono } from './icono';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { etiqueta: string; activo?: boolean; alPresionar?: () => void };

/** Opción de filtro que se marca y desmarca; la marcada lleva ✓ para que se note el estado. */
export function Chip({ etiqueta, activo, alPresionar }: Props) {
  const tema = useTheme();
  return (
    <Pressable
      accessibilityRole={alPresionar ? 'button' : 'text'}
      accessibilityState={alPresionar ? { selected: !!activo } : undefined}
      onPress={alPresionar}
      disabled={!alPresionar}
      style={({ pressed, hovered }) => [
        styles.chip,
        {
          backgroundColor: activo
            ? tema.accentSuave
            : hovered
              ? tema.backgroundSelected
              : tema.background,
          borderColor: activo ? tema.accent : tema.border,
        },
        pressed && { opacity: 0.7 },
      ]}>
      {activo ? <Icono nombre="check" color={tema.accent} tamano={16} /> : null}
      <ThemedText
        type="small"
        style={{
          color: activo ? tema.accent : tema.text,
          fontWeight: activo ? 700 : 500,
          flexShrink: 1,
        }}>
        {etiqueta}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
    // Los nombres largos (actos procesales) pasan a dos líneas en vez de salirse.
    maxWidth: '100%',
  },
});
