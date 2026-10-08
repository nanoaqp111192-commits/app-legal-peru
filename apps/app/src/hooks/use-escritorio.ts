import { useSyncExternalStore } from 'react';
import { useWindowDimensions } from 'react-native';

import { AnchoEscritorio } from '@/constants/theme';

const sinSuscripcion = () => () => {};

/**
 * true en pantallas anchas (escritorio o tableta horizontal). La página web estática
 * se genera en modo angosto y cambia al hidratar, así el HTML del servidor coincide
 * con el primer render del navegador.
 */
export function useEscritorio(): boolean {
  const { width } = useWindowDimensions();
  const enCliente = useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
  return enCliente && width >= AnchoEscritorio;
}
