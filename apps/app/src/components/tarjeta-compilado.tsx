import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { diaEnLima } from '@/lib/compilados';
import { fechaCorta } from '@/lib/fechas';
import type { Compilado } from '@/lib/tipos';

export function TarjetaCompilado({ compilado: c }: { compilado: Compilado }) {
  const tema = useTheme();
  const estado = c.cambiado_en
    ? `Cambio detectado el ${fechaCorta(diaEnLima(c.cambiado_en))}`
    : `Sin cambios desde que se vigila (${fechaCorta(diaEnLima(c.creado_en))})`;
  return (
    <Link href={{ pathname: '/compilado/[id]', params: { id: String(c.id) } }} asChild>
      <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }}>
        <ThemedView type="backgroundElement" style={[styles.tarjeta, { borderColor: tema.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {c.materia ?? 'Sin materia'}
          </ThemedText>
          <ThemedText>{c.titulo}</ThemedText>
          {c.numeros ? (
            <ThemedText type="small" themeColor="textSecondary">
              {c.numeros}
            </ThemedText>
          ) : null}
          <ThemedText type="small" style={c.cambiado_en ? { color: tema.accent } : undefined}>
            {estado}
            {c.verificado_en ? ` · revisado el ${fechaCorta(diaEnLima(c.verificado_en))}` : ''}
          </ThemedText>
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
