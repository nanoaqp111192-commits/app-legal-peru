import { Tarjeta } from './tarjeta';
import { ThemedText } from './themed-text';

import { useTheme } from '@/hooks/use-theme';
import { fechaCorta } from '@/lib/fechas';
import type { Resolucion } from '@/lib/tipos';

export function TarjetaResolucion({ resolucion: r }: { resolucion: Resolucion }) {
  const tema = useTheme();
  return (
    <Tarjeta href={{ pathname: '/resolucion/[id]', params: { id: String(r.id) } }}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {[r.proceso, r.tipo, r.colegiado, fechaCorta(r.fecha_publicacion)]
          .filter(Boolean)
          .join(' · ')}
      </ThemedText>
      <ThemedText type="smallBold">
        Exp. {r.expediente}
        {r.numero ? ` · ${r.numero}` : ''}
      </ThemedText>
      <ThemedText numberOfLines={3}>
        {r.sumilla ?? `${r.demandante ?? ''} contra ${r.demandado ?? ''}`}
      </ThemedText>
      {r.fallo ? (
        <ThemedText type="small" numberOfLines={2} style={{ color: tema.accent }}>
          {r.fallo}
        </ThemedText>
      ) : null}
    </Tarjeta>
  );
}
