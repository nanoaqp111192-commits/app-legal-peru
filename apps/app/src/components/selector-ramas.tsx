import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from './chip';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useEscritorio } from '@/hooks/use-escritorio';
import { RAMAS } from '@/lib/ramas';

type Props = {
  seleccion: string[];
  alCambiar: (seleccion: string[]) => void;
  incluirOtros?: boolean;
  /** Rótulo sobre las opciones; null cuando la pantalla ya pone el suyo. */
  titulo?: string | null;
};

/**
 * Filtro por rama; sin selección significa "todas". En el teléfono es una fila que se
 * desliza; en escritorio se muestran todas las ramas, sin esconder ninguna.
 */
export function SelectorRamas({
  seleccion,
  alCambiar,
  incluirOtros = false,
  titulo = 'Filtrar por rama del derecho',
}: Props) {
  const escritorio = useEscritorio();
  const ramas = RAMAS.filter((r) => incluirOtros || r.slug !== 'otros');
  const alternar = (slug: string) =>
    alCambiar(
      seleccion.includes(slug) ? seleccion.filter((s) => s !== slug) : [...seleccion, slug],
    );

  const opciones = (
    <>
      <Chip etiqueta="Todas" activo={seleccion.length === 0} alPresionar={() => alCambiar([])} />
      {ramas.map((r) => (
        <Chip
          key={r.slug}
          etiqueta={r.nombre}
          activo={seleccion.includes(r.slug)}
          alPresionar={() => alternar(r.slug)}
        />
      ))}
    </>
  );

  return (
    <View style={styles.bloque}>
      {titulo ? (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {titulo}
        </ThemedText>
      ) : null}
      {escritorio ? (
        <View style={[styles.fila, styles.envolver]}>{opciones}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fila}>
          {opciones}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: Spacing.two },
  fila: { gap: Spacing.two, paddingVertical: Spacing.one },
  envolver: { flexDirection: 'row', flexWrap: 'wrap' },
});
