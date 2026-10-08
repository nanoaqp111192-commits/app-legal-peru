import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Vacio } from '@/components/avisos';
import { ExternalLink } from '@/components/external-link';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { PRECEDENTES } from '@/lib/datos';
import { fechaLarga } from '@/lib/fechas';
import { CATEGORIAS, ETIQUETA_FECHA } from '@/lib/precedentes';

export default function DetallePrecedente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = PRECEDENTES.find((x) => x.id === id);

  return (
    <Pantalla conEncabezado>
      <Stack.Screen options={{ title: p ? p.numero : 'Corte Suprema' }} />
      {!p ? <Vacio>No encontramos este precedente.</Vacio> : null}
      {p ? (
        <>
          <View style={styles.bloque}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Corte Suprema · {CATEGORIAS[p.categoria]}
            </ThemedText>
            <ThemedText style={styles.titulo}>{p.numero}</ThemedText>
            {p.expediente ? <ThemedText>{p.expediente}</ThemedText> : null}
            {p.pleno ? (
              <ThemedText type="small" themeColor="textSecondary">
                {p.pleno}
              </ThemedText>
            ) : null}
            {p.fecha ? (
              <ThemedText type="small" themeColor="textSecondary">
                {p.tipo_fecha ? ETIQUETA_FECHA[p.tipo_fecha] : 'Fecha:'} {fechaLarga(p.fecha)}
              </ThemedText>
            ) : null}
          </View>

          <ThemedText>
            <ThemedText type="smallBold">Materia: </ThemedText>
            {p.tema}
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.caja}>
            <ThemedText type="small">
              Aquí ves la materia; la regla vinculante está en el texto oficial. Léelo antes de
              citarlo y confirma que no haya sido modificado por un pleno posterior.
            </ThemedText>
            {p.url_oficial ? (
              <ExternalLink href={p.url_oficial}>
                <ThemedText type="linkPrimary">Ver el texto oficial</ThemedText>
              </ExternalLink>
            ) : null}
            <ExternalLink href={p.url_verificacion}>
              <ThemedText type="linkPrimary">
                {p.url_oficial ? 'Ver la fuente de verificación' : 'Ver el texto'}
              </ThemedText>
            </ExternalLink>
          </ThemedView>
        </>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: Spacing.one },
  titulo: { fontSize: 20, lineHeight: 28, fontWeight: 600 },
  caja: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
});
