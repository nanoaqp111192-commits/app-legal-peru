import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from './chip';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useEscritorio } from '@/hooks/use-escritorio';
import { RAMAS, SIN_RAMA } from '@/lib/ramas';

type Props = {
  seleccion: string[];
  alCambiar: (seleccion: string[]) => void;
  /**
   * Cantidad por rama. Si se pasa, cada opción muestra su cantidad, aparecen las categorías sin rama y se
   * esconden las ramas sin resultados, para que el filtro sirva para clasificar.
   */
  conteos?: { total: number; porRama: Record<string, number> };
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
  conteos,
  titulo = 'Filtrar por rama del derecho',
}: Props) {
  const escritorio = useEscritorio();
  const ramas = RAMAS.filter((r) =>
    conteos
      ? (conteos.porRama[r.slug] ?? 0) > 0 || seleccion.includes(r.slug)
      : !SIN_RAMA.includes(r.slug),
  );
  const conCantidad = (nombre: string, n?: number) => (conteos ? `${nombre} · ${n ?? 0}` : nombre);
  const alternar = (slug: string) =>
    alCambiar(
      seleccion.includes(slug) ? seleccion.filter((s) => s !== slug) : [...seleccion, slug],
    );

  const opciones = (
    <>
      <Chip
        etiqueta={conCantidad('Todas', conteos?.total)}
        activo={seleccion.length === 0}
        alPresionar={() => alCambiar([])}
      />
      {ramas.map((r) => (
        <Chip
          key={r.slug}
          etiqueta={conCantidad(r.nombre, conteos?.porRama[r.slug])}
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
