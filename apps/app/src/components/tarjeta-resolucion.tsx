import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fechaCorta } from '@/lib/fechas';
import type { Resolucion } from '@/lib/tipos';

export function TarjetaResolucion({ resolucion: r }: { resolucion: Resolucion }) {
  const tema = useTheme();
  return (
    <Link href={{ pathname: '/resolucion/[id]', params: { id: String(r.id) } }} asChild>
      <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }}>
        <ThemedView type="backgroundElement" style={[styles.tarjeta, { borderColor: tema.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {[r.proceso, r.tipo, r.colegiado, fechaCorta(r.fecha_publicacion)]
              .filter(Boolean)
              .join(' · ')}
          </ThemedText>
          <ThemedText type="smallBold">
            Exp. {r.expediente}
            {r.numero ? ` · ${r.numero}` : ''}
          </ThemedText>
          <ThemedText numberOfLines={3}>
            {r.sumilla ?? `${r.demandante ?? ''} contra ${r.demandado ?? ''}`}
          </ThemedText>
          {r.fallo ? (
            <ThemedText type="small" numberOfLines={2} style={{ color: tema.accent }}>
              {r.fallo}
            </ThemedText>
          ) : null}
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
