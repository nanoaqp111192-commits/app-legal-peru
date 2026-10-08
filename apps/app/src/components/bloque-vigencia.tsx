import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCarga } from '@/hooks/use-carga';
import { vigenciaDe } from '@/lib/datos';
import type { Norma } from '@/lib/tipos';
import { estadoVigencia, TITULO_ESTADO, verbo } from '@/lib/vigencia';

import { ListaModificaciones } from './lista-modificaciones';

/** Verificación mínima de vigencia a partir de las normas ya cargadas. */
export function BloqueVigencia({ norma }: { norma: Norma }) {
  const { datos: vigencia } = useCarga(() => vigenciaDe(norma), String(norma.id));
  if (!vigencia) return null;
  const estado = estadoVigencia(vigencia);

  return (
    <ThemedView type="backgroundElement" style={styles.caja}>
      <ThemedText type="smallBold">Vigencia: {TITULO_ESTADO[estado]}</ThemedText>
      <ListaModificaciones afectadaPor={vigencia.afectadaPor} />
      {vigencia.compilados?.map((c) => (
        <Link key={c.id} href={`/compilado/${c.id}`}>
          <ThemedText type="linkPrimary">Texto actualizado de El Peruano: {c.titulo}</ThemedText>
        </Link>
      ))}
      {vigencia.afecta.length ? (
        <View style={styles.lista}>
          <ThemedText type="small" themeColor="textSecondary">
            Esta norma declara:
          </ThemedText>
          {vigencia.afecta.map((a) => (
            <Link
              key={`${a.clave_afectada}-${a.efecto}`}
              href={{ pathname: '/afectada/[clave]', params: { clave: a.clave_afectada } }}>
              <ThemedText type="small">
                {verbo(a)} <ThemedText type="linkPrimary">{a.referencia}</ThemedText>
              </ThemedText>
            </Link>
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
