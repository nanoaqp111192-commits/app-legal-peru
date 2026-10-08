import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Cargando, MensajeError, Vacio } from '@/components/avisos';
import { BotonEnlace } from '@/components/boton';
import { ListaModificaciones } from '@/components/lista-modificaciones';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCarga } from '@/hooks/use-carga';
import { diaEnLima } from '@/lib/compilados';
import { obtenerCompilado } from '@/lib/datos';
import { fechaCorta } from '@/lib/fechas';

/** Un texto actualizado de El Peruano y las normas publicadas que lo modifican. */
export default function DetalleCompilado() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { datos, error, cargando } = useCarga(() => obtenerCompilado(Number(id)), id);
  const c = datos?.compilado;

  return (
    <Pantalla conEncabezado>
      <Stack.Screen options={{ title: 'Texto actualizado' }} />
      {cargando ? <Cargando /> : null}
      {error ? <MensajeError error={error} /> : null}
      {!cargando && !error && !c ? <Vacio>No encontramos este texto.</Vacio> : null}
      {c ? (
        <>
          <View style={styles.bloque}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {c.materia ?? 'Sin materia'}
            </ThemedText>
            <ThemedText style={styles.titulo}>{c.titulo}</ThemedText>
            {c.numeros ? (
              <ThemedText type="small" themeColor="textSecondary">
                {c.numeros}
              </ThemedText>
            ) : null}
          </View>
          <ThemedView type="backgroundElement" style={styles.caja}>
            <BotonEnlace href={c.url_pdf} externo etiqueta="Abrir el PDF de El Peruano" />
            <ThemedText type="small" themeColor="textSecondary">
              {c.cambiado_en
                ? `El PDF cambió el ${fechaCorta(diaEnLima(c.cambiado_en))}.`
                : `Sin cambios en el PDF desde que se vigila (${fechaCorta(diaEnLima(c.creado_en))}).`}
            </ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.caja}>
            <ThemedText type="smallBold">Normas publicadas que lo modifican</ThemedText>
            {datos.afectadaPor.length ? (
              <ListaModificaciones afectadaPor={datos.afectadaPor} conAfectada />
            ) : (
              <ThemedText type="small">Ninguna detectada en las normas cargadas.</ThemedText>
            )}
            <ThemedText type="small" themeColor="textSecondary">
              Sirve para saber si el PDF ya debería incluir una modificación reciente. Detección
              automática por título; no reemplaza la revisión en SPIJ.
            </ThemedText>
          </ThemedView>
        </>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: Spacing.one },
  titulo: { fontSize: 20, lineHeight: 28, fontWeight: 600 },
  caja: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
});
