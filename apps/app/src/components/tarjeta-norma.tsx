import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fechaCorta } from '@/lib/fechas';
import { nombreRama } from '@/lib/ramas';
import type { Norma } from '@/lib/tipos';

export function TarjetaNorma({ norma, mostrarFecha }: { norma: Norma; mostrarFecha?: boolean }) {
  const tema = useTheme();
  return (
    <Link href={{ pathname: '/norma/[id]', params: { id: String(norma.id) } }} asChild>
      <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }}>
        <ThemedView type="backgroundElement" style={[styles.tarjeta, { borderColor: tema.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {norma.sector ?? 'Sin sector'}
            {mostrarFecha ? ` · ${fechaCorta(norma.fecha_publicacion)}` : ''}
            {norma.edicion_extraordinaria ? ' · Edición extraordinaria' : ''}
          </ThemedText>
          {norma.numero ? <ThemedText type="smallBold">{norma.numero}</ThemedText> : null}
          <ThemedText>{norma.titulo}</ThemedText>
          <View style={styles.ramas}>
            {norma.ramas
              .filter((r) => r !== 'otros')
              .map((r) => (
                <ThemedText key={r} type="small" style={{ color: tema.accent }}>
                  #{nombreRama(r)}
                </ThemedText>
              ))}
          </View>
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
  ramas: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
