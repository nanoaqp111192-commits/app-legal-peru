import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icono } from './icono';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Tarjeta que abre una ficha: toda la tarjeta es el enlace y la flecha lo indica. */
export function Tarjeta({ href, children }: { href: Href; children: ReactNode }) {
  const tema = useTheme();
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link">
        {({ hovered, pressed }) => (
          <View
            style={[
              styles.tarjeta,
              {
                backgroundColor: hovered ? tema.backgroundElement : tema.background,
                borderColor: hovered ? tema.accent : tema.border,
              },
              pressed && { opacity: 0.7 },
            ]}>
            <View style={styles.contenido}>{children}</View>
            <Icono nombre="siguiente" color={hovered ? tema.accent : tema.textSecondary} />
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  contenido: { flex: 1, gap: Spacing.one },
});
