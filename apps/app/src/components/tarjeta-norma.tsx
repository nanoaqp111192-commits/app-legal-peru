import { StyleSheet, View } from 'react-native';

import { Tarjeta } from './tarjeta';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fechaCorta } from '@/lib/fechas';
import { nombreRama } from '@/lib/ramas';
import type { Norma } from '@/lib/tipos';

export function TarjetaNorma({ norma, mostrarFecha }: { norma: Norma; mostrarFecha?: boolean }) {
  const tema = useTheme();
  const ramas = norma.ramas.filter((r) => r !== 'otros');
  return (
    <Tarjeta href={{ pathname: '/norma/[id]', params: { id: String(norma.id) } }}>
      <ThemedText type="small" themeColor="textSecondary">
        {norma.sector ?? 'Sin sector'}
        {mostrarFecha ? ` · ${fechaCorta(norma.fecha_publicacion)}` : ''}
        {norma.edicion_extraordinaria ? ' · Edición extraordinaria' : ''}
      </ThemedText>
      {norma.numero ? (
        <ThemedText type="smallBold" style={{ color: tema.accent }}>
          {norma.numero}
        </ThemedText>
      ) : null}
      <ThemedText style={styles.titulo}>{norma.titulo}</ThemedText>
      {ramas.length ? (
        <View style={styles.ramas}>
          {ramas.map((r) => (
            <ThemedView key={r} type="accentSuave" style={styles.rama}>
              <ThemedText type="small" style={{ color: tema.accent, fontSize: 12, lineHeight: 18 }}>
                {nombreRama(r)}
              </ThemedText>
            </ThemedView>
          ))}
        </View>
      ) : null}
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  titulo: { fontWeight: 600 },
  ramas: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  rama: { paddingHorizontal: Spacing.two, borderRadius: 999 },
});
