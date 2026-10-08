import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCarga } from '@/hooks/use-carga';
import { vigenciaDe } from '@/lib/datos';
import { fechaCorta } from '@/lib/fechas';
import type { Norma } from '@/lib/tipos';
import { estadoVigencia, TITULO_ESTADO, verbo } from '@/lib/vigencia';

/** Verificación mínima de vigencia a partir de las normas ya cargadas. */
export function BloqueVigencia({ norma }: { norma: Norma }) {
  const { datos: vigencia } = useCarga(() => vigenciaDe(norma), String(norma.id));
  if (!vigencia) return null;
  const estado = estadoVigencia(vigencia);

  return (
    <ThemedView type="backgroundElement" style={styles.caja}>
      <ThemedText type="smallBold">Vigencia: {TITULO_ESTADO[estado]}</ThemedText>
      {vigencia.afectadaPor.map((a) =>
        a.norma ? (
          <Link key={`${a.norma.id}-${a.efecto}`} href={`/norma/${a.norma.id}`}>
            <ThemedText type="small">
              {verbo(a)}:{' '}
              <ThemedText type="linkPrimary">{a.norma.numero ?? a.norma.titulo}</ThemedText> (
              {fechaCorta(a.norma.fecha_publicacion)})
            </ThemedText>
          </Link>
        ) : null,
      )}
      {vigencia.afecta.length ? (
        <View style={styles.lista}>
          <ThemedText type="small" themeColor="textSecondary">
            Esta norma declara:
          </ThemedText>
          {vigencia.afecta.map((a) => (
            <ThemedText key={`${a.clave_afectada}-${a.efecto}`} type="small">
              {verbo(a)} {a.referencia}
            </ThemedText>
          ))}
        </View>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">
        Detección automática a partir de los títulos de las normas publicadas en El Peruano que
        tenemos cargadas. No reemplaza la revisión del texto vigente en SPIJ.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  caja: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  lista: { gap: Spacing.half },
});
