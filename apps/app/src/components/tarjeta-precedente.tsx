import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fechaCorta } from '@/lib/fechas';
import { CATEGORIAS, type Precedente } from '@/lib/precedentes';

export function TarjetaPrecedente({ precedente: p }: { precedente: Precedente }) {
  const tema = useTheme();
  return (
    <Link href={{ pathname: '/precedente/[id]', params: { id: p.id } }} asChild>
      <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }}>
        <ThemedView type="backgroundElement" style={[styles.tarjeta, { borderColor: tema.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {[CATEGORIAS[p.categoria], p.fecha ? fechaCorta(p.fecha) : null]
              .filter(Boolean)
              .join(' · ')}
          </ThemedText>
          <ThemedText type="smallBold">
            {p.numero}
            {p.expediente ? ` · ${p.expediente}` : ''}
          </ThemedText>
          <ThemedText numberOfLines={3}>{p.tema}</ThemedText>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.one,
  },
});
