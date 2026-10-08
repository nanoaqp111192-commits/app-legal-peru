import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Cargando, MensajeError, Vacio } from '@/components/avisos';
import { BloqueVigencia } from '@/components/bloque-vigencia';
import { BotonEnlace } from '@/components/boton';
import { Pantalla } from '@/components/pantalla';
import { TextoNorma } from '@/components/texto-norma';
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
    <Pantalla conEncabezado lectura>
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
            {norma.numero ? (
              <ThemedText type="smallBold" style={{ color: tema.accent }}>
                {norma.numero}
              </ThemedText>
            ) : null}
            <ThemedText style={styles.titulo}>{norma.titulo}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Publicada el {fechaLarga(norma.fecha_publicacion)}
              {norma.edicion_extraordinaria ? ', edición extraordinaria' : ''}
            </ThemedText>
            <View style={styles.ramas}>
              {norma.ramas
                .filter((r) => r !== 'otros')
                .map((r) => (
                  <ThemedView key={r} type="accentSuave" style={styles.etiqueta}>
                    <ThemedText type="small" style={{ color: tema.accent }}>
                      {nombreRama(r)}
                    </ThemedText>
                  </ThemedView>
                ))}
            </View>
          </View>

          <View style={styles.acciones}>
            <BotonEnlace href={norma.url_oficial} externo etiqueta="Ver en El Peruano" />
            {norma.url_pdf ? (
              <BotonEnlace
                href={norma.url_pdf}
                externo
                icono="descargar"
                variante="secundario"
                etiqueta="Descargar PDF oficial"
              />
            ) : null}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            La versión oficial es la publicada en El Peruano: revísala antes de citar la norma.
            Última verificación contra la fuente: {fechaCorta(norma.verificado_en.slice(0, 10))}.
          </ThemedText>

          <BloqueVigencia norma={norma} />

          <View style={[styles.separador, { backgroundColor: tema.border }]} />
          {norma.texto ? (
            <TextoNorma texto={norma.texto} titulo={norma.titulo} />
          ) : (
            <Vacio>El texto completo aún no se ha descargado. Ábrelo en El Peruano.</Vacio>
          )}
        </>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: Spacing.two },
  titulo: { fontSize: 24, lineHeight: 32, fontWeight: 700 },
  ramas: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  etiqueta: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: 999 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  separador: { height: 1, marginVertical: Spacing.two },
});
