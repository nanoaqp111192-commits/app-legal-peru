import { useCallback, useEffect, useState } from 'react';

type Estado<T> = { clave: string; datos: T | null; error: unknown };

/**
 * Ejecuta `cargar` cada vez que cambia `clave` y expone su estado; `recargar` la repite.
 * Mientras llega una carga nueva se conservan los datos anteriores.
 */
export function useCarga<T>(cargar: () => Promise<T>, clave = '') {
  const [version, setVersion] = useState(0);
  const actual = `${clave}#${version}`;
  const [estado, setEstado] = useState<Estado<T>>({ clave: '', datos: null, error: null });

  useEffect(() => {
    let vigente = true;
    cargar()
      .then((datos) => vigente && setEstado({ clave: actual, datos, error: null }))
      .catch((error) => vigente && setEstado((e) => ({ clave: actual, datos: e.datos, error })));
    return () => {
      vigente = false;
    };
    // `cargar` suele ser una función nueva en cada render; `clave` resume sus dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return {
    datos: estado.datos,
    error: estado.clave === actual ? estado.error : null,
    cargando: estado.clave !== actual,
    recargar,
  };
}
