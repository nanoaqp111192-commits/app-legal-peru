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
import { obtenerResolucion } from '@/lib/datos';
import { fechaLarga } from '@/lib/fechas';

export default function DetalleResolucion() {
  const tema = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { datos: r, error, cargando } = useCarga(() => obtenerResolucion(Number(id)), id);

  return (
    <Pantalla conEncabezado>
      <Stack.Screen options={{ title: r ? `Exp. ${r.expediente}` : 'Resolución del TC' }} />
      {cargando ? <Cargando /> : null}
      {error ? <MensajeError error={error} /> : null}
      {!cargando && !error && !r ? <Vacio>No encontramos esta resolución.</Vacio> : null}
      {r ? (
        <>
          <View style={styles.bloque}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Tribunal Constitucional ·{' '}
              {[r.proceso, r.tipo, r.colegiado].filter(Boolean).join(' · ')}
            </ThemedText>
            <ThemedText style={styles.titulo}>
              Exp. {r.expediente}
              {r.numero ? ` · ${r.numero}` : ''}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Publicada el {fechaLarga(r.fecha_publicacion)}
            </ThemedText>
          </View>

          <View style={styles.bloque}>
            {r.demandante ? <Dato etiqueta="Demandante" valor={r.demandante} /> : null}
            {r.demandado ? <Dato etiqueta="Demandado" valor={r.demandado} /> : null}
            {r.sumilla ? <Dato etiqueta="Asunto" valor={r.sumilla} /> : null}
          </View>

          {r.fallo ? (
            <ThemedView style={[styles.caja, { borderColor: tema.accent }, styles.fallo]}>
              <ThemedText type="smallBold">Fallo</ThemedText>
              <ThemedText>{r.fallo}</ThemedText>
            </ThemedView>
          ) : null}

          <ThemedView type="backgroundElement" style={styles.caja}>
            <ThemedText type="small">
              La versión oficial es la publicada por el Tribunal Constitucional. Revísala antes de
              citarla.
            </ThemedText>
            {r.url_pdf ? (
              <ExternalLink href={r.url_pdf}>
                <ThemedText type="linkPrimary">Ver PDF oficial</ThemedText>
              </ExternalLink>
            ) : null}
            <ExternalLink href={r.url_oficial}>
              <ThemedText type="linkPrimary">Ver la ficha del expediente en el TC</ThemedText>
            </ExternalLink>
          </ThemedView>

          {r.texto ? (
            <ThemedText selectable style={styles.texto}>
              {r.texto}
            </ThemedText>
          ) : (
            <Vacio>El texto completo no está disponible aquí. Ábrelo en el PDF oficial.</Vacio>
          )}
        </>
      ) : null}
    </Pantalla>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <ThemedText type="small">
      <ThemedText type="smallBold">{etiqueta}: </ThemedText>
      {valor}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: Spacing.one },
  titulo: { fontSize: 20, lineHeight: 28, fontWeight: 600 },
  caja: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  fallo: { borderWidth: 1 },
  texto: { lineHeight: 26 },
});
