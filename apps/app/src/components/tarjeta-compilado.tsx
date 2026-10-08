import { Tarjeta } from './tarjeta';
import { ThemedText } from './themed-text';

import { useTheme } from '@/hooks/use-theme';
import { diaEnLima } from '@/lib/compilados';
import { fechaCorta } from '@/lib/fechas';
import type { Compilado } from '@/lib/tipos';

export function TarjetaCompilado({ compilado: c }: { compilado: Compilado }) {
  const tema = useTheme();
  const estado = c.cambiado_en
    ? `Cambio detectado el ${fechaCorta(diaEnLima(c.cambiado_en))}`
    : `Sin cambios desde que se vigila (${fechaCorta(diaEnLima(c.creado_en))})`;
  return (
    <Tarjeta href={{ pathname: '/compilado/[id]', params: { id: String(c.id) } }}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {c.materia ?? 'Sin materia'}
      </ThemedText>
      <ThemedText>{c.titulo}</ThemedText>
      {c.numeros ? (
        <ThemedText type="small" themeColor="textSecondary">
          {c.numeros}
        </ThemedText>
      ) : null}
      <ThemedText type="small" style={c.cambiado_en ? { color: tema.accent } : undefined}>
        {estado}
        {c.verificado_en ? ` · revisado el ${fechaCorta(diaEnLima(c.verificado_en))}` : ''}
      </ThemedText>
    </Tarjeta>
  );
}
