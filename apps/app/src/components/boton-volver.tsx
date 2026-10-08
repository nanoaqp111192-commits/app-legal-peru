import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Icono } from './icono';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Web: "Volver" visible; si se entró directo por un enlace, lleva al inicio. */
export function BotonVolver() {
  const tema = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={({ hovered }) => [
        styles.boton,
        { borderColor: tema.border },
        hovered && { backgroundColor: tema.backgroundElement },
      ]}>
      <Icono nombre="volver" color={tema.text} tamano={18} />
      <ThemedText type="small">Volver</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one + 2,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: Spacing.three,
  },
});
