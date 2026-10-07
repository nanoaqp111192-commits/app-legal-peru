import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Cargando, MensajeError, Vacio } from '@/components/avisos';
import { ExternalLink } from '@/components/external-link';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCarga } from '@/hooks/use-carga';
import { useTheme } from '@/hooks/use-theme';
import { obtenerNorma } from '@/lib/datos';
import { fechaCorta, fechaLarga } from '@/lib/fechas';
import { nombreRama } from '@/lib/ramas';

export default function DetalleNorma() {
  const tema = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { datos: norma, error, cargando } = useCarga(() => obtenerNorma(Number(id)), id);

  return (
    <Pantalla conEncabezado>
      <Stack.Screen options={{ title: norma?.numero ?? 'Norma' }} />
      {cargando ? <Cargando /> : null}
      {error ? <MensajeError error={error} /> : null}
      {!cargando && !error && !norma ? <Vacio>No encontramos esta norma.</Vacio> : null}
      {norma ? (
        <>
          <View style={styles.bloque}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {norma.sector}
            </ThemedText>
            {norma.numero ? <ThemedText type="smallBold">{norma.numero}</ThemedText> : null}
            <ThemedText style={styles.titulo}>{norma.titulo}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Publicada el {fechaLarga(norma.fecha_publicacion)}
              {norma.edicion_extraordinaria ? ', edición extraordinaria' : ''}
            </ThemedText>
            <ThemedText type="small" style={{ color: tema.accent }}>
              {norma.ramas.map((r) => `#${nombreRama(r)}`).join('  ')}
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.aviso}>
            <ThemedText type="small">
              La versión oficial es la publicada en El Peruano. Revísala antes de citar la norma.
            </ThemedText>
            <ExternalLink href={norma.url_oficial}>
              <ThemedText type="linkPrimary">Ver en El Peruano (fuente oficial)</ThemedText>
            </ExternalLink>
            {norma.url_pdf ? (
              <ExternalLink href={norma.url_pdf}>
                <ThemedText type="linkPrimary">Descargar PDF oficial</ThemedText>
              </ExternalLink>
            ) : null}
            <ThemedText type="small" themeColor="textSecondary">
              Última verificación contra la fuente: {fechaCorta(norma.verificado_en.slice(0, 10))}
            </ThemedText>
          </ThemedView>

          {norma.texto ? (
            <ThemedText selectable style={styles.texto}>
              {norma.texto}
            </ThemedText>
          ) : (
            <Vacio>El texto completo aún no se ha descargado. Ábrelo en El Peruano.</Vacio>
          )}
        </>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: Spacing.one },
  titulo: { fontSize: 20, lineHeight: 28, fontWeight: 600 },
  aviso: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  texto: { lineHeight: 26 },
});
