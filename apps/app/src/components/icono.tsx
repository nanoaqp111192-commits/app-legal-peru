import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

type Nombre = ComponentProps<typeof SymbolView>['name'];

/** Íconos de la app: SF Symbols en iOS y Material Symbols en Android y web. */
const ICONOS = {
  hoy: { ios: 'newspaper', android: 'newspaper', web: 'newspaper' },
  buscar: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  modelos: { ios: 'doc.text', android: 'description', web: 'description' },
  plazos: { ios: 'calendar', android: 'event', web: 'event' },
  alertas: { ios: 'bell', android: 'notifications', web: 'notifications' },
  externo: { ios: 'arrow.up.right.square', android: 'open_in_new', web: 'open_in_new' },
  volver: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  descargar: { ios: 'arrow.down.doc', android: 'download', web: 'download' },
  copiar: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' },
  cerrar: { ios: 'xmark', android: 'close', web: 'close' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  siguiente: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  balanza: { ios: 'building.columns', android: 'balance', web: 'balance' },
  actualizado: { ios: 'arrow.triangle.2.circlepath', android: 'update', web: 'update' },
} satisfies Record<string, Nombre>;

export type NombreIcono = keyof typeof ICONOS;

export function Icono({
  nombre,
  color,
  tamano = 20,
}: {
  nombre: NombreIcono;
  color: string;
  tamano?: number;
}) {
  return <SymbolView name={ICONOS[nombre]} tintColor={color} size={tamano} />;
}
