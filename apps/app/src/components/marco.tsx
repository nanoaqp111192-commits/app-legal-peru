import type { ReactNode } from 'react';

/** En el teléfono la navegación son las pestañas nativas: no hace falta marco. */
export function Marco({ children }: { children: ReactNode }) {
  return children;
}
