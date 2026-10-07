import { useSyncExternalStore } from 'react';

// Si la última carga se respondió con la copia local, guarda cuándo se hizo esa copia.
let copiaDel: string | null = null;
const oyentes = new Set<() => void>();

export function marcarCopia(guardado: string | null) {
  if (guardado === copiaDel) return;
  copiaDel = guardado;
  oyentes.forEach((o) => o());
}

const suscribir = (o: () => void) => {
  oyentes.add(o);
  return () => oyentes.delete(o);
};

/** Fecha (ISO) de la copia que se está mostrando, o null si los datos son en vivo. */
export function useCopiaSinConexion(): string | null {
  return useSyncExternalStore(
    suscribir,
    () => copiaDel,
    () => null,
  );
}
