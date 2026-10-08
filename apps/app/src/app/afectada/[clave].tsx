import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Cargando, MensajeError, Vacio } from '@/components/avisos';
import { ListaModificaciones } from '@/components/lista-modificaciones';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCarga } from '@/hooks/use-carga';
import { historialDe } from '@/lib/datos';
import { nombreClave } from '@/lib/vigencia';

/** Modificaciones de una norma identificada por su clave, esté o no cargada. */
export default function NormaAfectada() {
  const { clave } = useLocalSearchParams<{ clave: string }>();
  const { datos, error, cargando } = useCarga(() => historialDe(clave), clave);
  const nombre = nombreClave(clave);

  return (
    <Pantalla conEncabezado>
      <Stack.Screen options={{ title: nombre }} />
      <ThemedText type="subtitle">{nombre}</ThemedText>
      {cargando ? <Cargando /> : null}
      {error ? <MensajeError error={error} /> : null}
      {datos ? (
        <>
          {datos.norma ? (
            <Link href={`/norma/${datos.norma.id}`}>
              <ThemedText type="linkPrimary">Ver la norma: {datos.norma.titulo}</ThemedText>
            </Link>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Esta norma no está cargada en la app; se muestran las normas publicadas desde 2026 que
              la modifican.
            </ThemedText>
          )}
          {datos.compilados.map((c) => (
            <Link key={c.id} href={`/compilado/${c.id}`}>
              <ThemedText type="linkPrimary">
                Texto actualizado de El Peruano: {c.titulo}
              </ThemedText>
            </Link>
          ))}
          <ThemedView type="backgroundElement" style={styles.caja}>
            <ThemedText type="smallBold">Normas que la derogan o modifican</ThemedText>
            {datos.afectadaPor.length ? (
              <ListaModificaciones afectadaPor={datos.afectadaPor} />
            ) : (
              <ThemedText type="small">Ninguna detectada en las normas cargadas.</ThemedText>
            )}
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary">
            Detección automática a partir de los títulos publicados en El Peruano. No reemplaza la
            revisión del texto vigente en SPIJ.
          </ThemedText>
        </>
      ) : !cargando && !error ? (
        <Vacio>Sin conexión con la base de normas.</Vacio>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  caja: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
});
