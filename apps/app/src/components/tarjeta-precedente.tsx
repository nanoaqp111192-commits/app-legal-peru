import { Tarjeta } from './tarjeta';
import { ThemedText } from './themed-text';

import { fechaCorta } from '@/lib/fechas';
import { CATEGORIAS, type Precedente } from '@/lib/precedentes';

export function TarjetaPrecedente({ precedente: p }: { precedente: Precedente }) {
  return (
    <Tarjeta href={{ pathname: '/precedente/[id]', params: { id: p.id } }}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {[CATEGORIAS[p.categoria], p.fecha ? fechaCorta(p.fecha) : null]
          .filter(Boolean)
          .join(' · ')}
      </ThemedText>
      <ThemedText type="smallBold">
        {p.numero}
        {p.expediente ? ` · ${p.expediente}` : ''}
      </ThemedText>
      <ThemedText numberOfLines={3}>{p.tema}</ThemedText>
    </Tarjeta>
  );
}
