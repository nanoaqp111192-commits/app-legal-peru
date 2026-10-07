import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from './chip';

import { Spacing } from '@/constants/theme';
import { RAMAS } from '@/lib/ramas';

type Props = {
  seleccion: string[];
  alCambiar: (seleccion: string[]) => void;
  incluirOtros?: boolean;
};

/** Fila desplazable de ramas; sin selección significa "todas". */
export function SelectorRamas({ seleccion, alCambiar, incluirOtros = false }: Props) {
  const ramas = RAMAS.filter((r) => incluirOtros || r.slug !== 'otros');
  const alternar = (slug: string) =>
    alCambiar(
      seleccion.includes(slug) ? seleccion.filter((s) => s !== slug) : [...seleccion, slug],
    );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.fila}>
      <Chip etiqueta="Todas" activo={seleccion.length === 0} alPresionar={() => alCambiar([])} />
      {ramas.map((r) => (
        <Chip
          key={r.slug}
          etiqueta={r.nombre}
          activo={seleccion.includes(r.slug)}
          alPresionar={() => alternar(r.slug)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ fila: { gap: Spacing.two, paddingVertical: Spacing.one } });
