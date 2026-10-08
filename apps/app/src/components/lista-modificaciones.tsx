import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { fechaCorta } from '@/lib/fechas';
import type { Afectacion } from '@/lib/tipos';
import { nombreClave, porFecha, verbo } from '@/lib/vigencia';

/**
 * Normas cargadas que derogan o modifican a otra, de la más reciente a la más antigua,
 * cada una con enlace a su ficha. Con `conAfectada` indica también a cuál de las
 * normas reunidas se refiere (útil en un texto compilado que reúne varias).
 */
export function ListaModificaciones({
  afectadaPor,
  conAfectada,
}: {
  afectadaPor: Afectacion[];
  conAfectada?: boolean;
}) {
  const lista = porFecha(afectadaPor).filter((a) => a.norma);
  if (!lista.length) return null;
  return (
    <View style={styles.lista}>
      {lista.map((a) => (
        <Link key={`${a.norma!.id}-${a.clave_afectada}-${a.efecto}`} href={`/norma/${a.norma!.id}`}>
          <ThemedText type="small">
            {fechaCorta(a.norma!.fecha_publicacion)} · {verbo(a)}
            {conAfectada ? ` ${nombreClave(a.clave_afectada)}` : ''}:{' '}
            <ThemedText type="linkPrimary">{a.norma!.numero ?? a.norma!.titulo}</ThemedText>
          </ThemedText>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: Spacing.one },
});
