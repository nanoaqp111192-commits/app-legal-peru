// Copia local de lo ya consultado para usar la app sin señal (p. ej. en audiencia).
// Lógica pura: el almacenamiento llega como parámetro para poder probarla en Node.

export type Almacen = {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
  removeItem(clave: string): void;
};

export type Entrada<T> = { guardado: string; valor: T };

const PREFIJO = 'cache:';
const INDICE = 'cache-indice';
/** Entradas que se conservan; las menos usadas se borran primero. */
export const MAXIMO_ENTRADAS = 120;

export function crearCache(almacen: () => Almacen | null, maximo = MAXIMO_ENTRADAS) {
  const indice = (): string[] => {
    try {
      return JSON.parse(almacen()?.getItem(INDICE) ?? '[]');
    } catch {
      return [];
    }
  };
  const guardarIndice = (claves: string[]) => almacen()?.setItem(INDICE, JSON.stringify(claves));
  const borrar = (claves: string[]) => {
    for (const c of claves) almacen()?.removeItem(PREFIJO + c);
  };

  function guardar<T>(clave: string, valor: T, ahora = new Date()) {
    const a = almacen();
    if (!a) return;
    const texto = JSON.stringify({ guardado: ahora.toISOString(), valor } satisfies Entrada<T>);
    let claves = [clave, ...indice().filter((c) => c !== clave)];
    borrar(claves.slice(maximo));
    claves = claves.slice(0, maximo);
    // Si el almacenamiento se llena (en web ~5 MB), se libera la mitad más antigua y se reintenta.
    for (let intento = 0; intento < 2; intento++) {
      try {
        a.setItem(PREFIJO + clave, texto);
        guardarIndice(claves);
        return;
      } catch {
        const conservar = Math.max(1, Math.floor(claves.length / 2));
        borrar(claves.slice(conservar));
        claves = claves.slice(0, conservar);
        try {
          guardarIndice(claves);
        } catch {}
      }
    }
  }

  function leer<T>(clave: string): Entrada<T> | null {
    try {
      const texto = almacen()?.getItem(PREFIJO + clave);
      return texto ? (JSON.parse(texto) as Entrada<T>) : null;
    } catch {
      return null;
    }
  }

  /** Valores guardados cuyas claves empiezan con `prefijo`, del más reciente al más antiguo. */
  function todos<T>(prefijo: string): T[] {
    return indice()
      .filter((c) => c.startsWith(prefijo))
      .map((c) => leer<T>(c)?.valor)
      .filter((v): v is T => v != null);
  }

  /**
   * Ejecuta `cargar`; si responde, guarda el resultado. Si falla (sin señal) y hay copia,
   * devuelve la copia y avisa con `alUsarCopia(fecha en que se guardó)`.
   */
  async function conRespaldo<T>(
    clave: string,
    cargar: () => Promise<T>,
    alUsarCopia: (guardado: string | null) => void,
  ): Promise<T> {
    try {
      const valor = await cargar();
      guardar(clave, valor);
      alUsarCopia(null);
      return valor;
    } catch (error) {
      const copia = leer<T>(clave);
      if (!copia) throw error;
      alUsarCopia(copia.guardado);
      return copia.valor;
    }
  }

  return { guardar, leer, todos, conRespaldo };
}
