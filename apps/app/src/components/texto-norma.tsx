import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Fonts, Spacing } from '@/constants/theme';
import { useEscritorio } from '@/hooks/use-escritorio';
import { bloquesDeTexto } from '@/lib/texto-norma';

/** Texto completo de una norma, con secciones y artículos destacados para leerlo de corrido. */
export function TextoNorma({ texto, titulo }: { texto: string; titulo?: string | null }) {
  const escritorio = useEscritorio();
  const tamano = escritorio ? styles.grande : null;
  return (
    <View style={styles.texto}>
      {bloquesDeTexto(texto, titulo).map((b, i) =>
        b.tipo === 'seccion' ? (
          <ThemedText key={i} selectable type="smallBold" style={styles.seccion}>
            {b.texto}
          </ThemedText>
        ) : (
          <ThemedText key={i} selectable style={[styles.parrafo, tamano]}>
            {b.tipo === 'articulo' ? (
              <ThemedText style={[styles.parrafo, tamano, styles.etiqueta]}>
                {b.etiqueta}{' '}
              </ThemedText>
            ) : null}
            {b.texto}
          </ThemedText>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  texto: { gap: Spacing.three },
  seccion: { marginTop: Spacing.two, letterSpacing: 0.5, textAlign: 'center' },
  parrafo: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 28, fontWeight: 400 },
  grande: { fontSize: 18, lineHeight: 31 },
  etiqueta: { fontWeight: 700 },
});
