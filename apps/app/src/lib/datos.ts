import { RESOLUCIONES_DEMO } from '@/data/jurisprudencia-demo';
import { NORMAS_DEMO } from '@/data/normas-demo';
import MODELOS from '@/data/modelos.json';
import CATALOGO_PRECEDENTES from '@/data/precedentes.json';

import { crearCache } from './cache';
import { marcarCopia } from './conexion';
import {
  buscarPrecedentes as filtrarPrecedentes,
  type Categoria,
  type Organo,
  type Precedente,
} from './precedentes';
import { supabase } from './supabase';
import type { Afectacion, Alerta, Compilado, Modelo, Norma, Resolucion, Vigencia } from './tipos';

const COLUMNAS_NORMA =
  'id,id_fuente,tipo,numero,titulo,sumilla,sector,fecha_publicacion,edicion_extraordinaria,url_oficial,url_pdf,ramas,verificado_en,clave';

const modelosLocales = MODELOS as Modelo[];
/** Precedentes de la Corte Suprema y de tribunales administrativos: viajan en la app. */
export const PRECEDENTES = CATALOGO_PRECEDENTES as Precedente[];

export async function buscarPrecedentes(consulta: string, categorias: Categoria[], de: Organo) {
  return filtrarPrecedentes(PRECEDENTES, consulta, categorias, de);
}

const cache = crearCache(() => (typeof localStorage === 'undefined' ? null : localStorage));

function respaldo<T>(clave: string, cargar: () => Promise<T>): Promise<T> {
  return cache.conRespaldo(clave, cargar, marcarCopia);
}

/** Lista guardada con id único, del más reciente al más antiguo. */
function unicos<T extends { id: number }>(listas: T[][]): T[] {
  const vistos = new Map<number, T>();
  for (const item of listas.flat()) if (!vistos.has(item.id)) vistos.set(item.id, item);
  return [...vistos.values()];
}

/**
 * Búsqueda con respaldo: si no hay señal, se busca dentro de lo ya consultado. Solo se
 * guardan las listas sin texto de búsqueda (filtros, lo más reciente): guardar cada término
 * que se escribe desplazaría de la copia las fichas con texto completo.
 */
async function buscarConRespaldo<T>(
  clave: string,
  consulta: string,
  cargar: () => Promise<T[]>,
  local: () => T[],
): Promise<T[]> {
  try {
    if (!consulta.trim()) return await respaldo(clave, cargar);
    const resultado = await cargar();
    marcarCopia(null);
    return resultado;
  } catch (error) {
    const encontrados = local();
    if (!encontrados.length) throw error;
    marcarCopia(new Date().toISOString());
    return encontrados;
  }
}

function filtrarNormas(normas: Norma[], consulta: string, ramas: string[]): Norma[] {
  const q = sinTildes(consulta);
  return normas.filter(
    (n) =>
      (!ramas.length || n.ramas.some((r) => ramas.includes(r))) &&
      (!q || sinTildes(`${n.numero} ${n.titulo} ${n.sector} ${n.sumilla ?? ''}`).includes(q)),
  );
}

function filtrarResoluciones(lista: Resolucion[], consulta: string, procesos: string[]) {
  const q = sinTildes(consulta);
  return lista.filter(
    (r) =>
      (!procesos.length || (r.proceso && procesos.includes(r.proceso))) &&
      (!q ||
        sinTildes(
          `${r.expediente} ${r.numero} ${r.sumilla} ${r.demandante} ${r.demandado}`,
        ).includes(q)),
  );
}

export async function normasDeFecha(fecha: string): Promise<Norma[]> {
  if (!supabase) return NORMAS_DEMO.filter((n) => n.fecha_publicacion === fecha);
  const cliente = supabase;
  return respaldo(`normas-dia:${fecha}`, async () => {
    const { data, error } = await cliente
      .from('normas')
      .select(COLUMNAS_NORMA)
      .eq('fecha_publicacion', fecha)
      .order('id', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Norma[];
  });
}

/** La fecha más reciente con normas, para no mostrar un día vacío temprano en la mañana. */
export async function ultimaFechaConNormas(): Promise<string | null> {
  if (!supabase) return NORMAS_DEMO[0]?.fecha_publicacion ?? null;
  const cliente = supabase;
  return respaldo('ultima-fecha', async () => {
    const { data, error } = await cliente
      .from('normas')
      .select('fecha_publicacion')
      .order('fecha_publicacion', { ascending: false })
      .limit(1);
    if (error) throw error;
    return (data?.[0]?.fecha_publicacion as string | undefined) ?? null;
  });
}

export async function buscarNormas(consulta: string, ramas: string[]): Promise<Norma[]> {
  if (!supabase) return filtrarNormas(NORMAS_DEMO, consulta, ramas);
  const cliente = supabase;
  return buscarConRespaldo(
    `busqueda-normas:${ramas.join(',')}`,
    consulta,
    async () => {
      const { data, error } = await cliente
        .rpc('buscar_normas', { consulta, filtro_ramas: ramas.length ? ramas : null, limite: 40 })
        .select(COLUMNAS_NORMA);
      if (error) throw error;
      return (data ?? []) as Norma[];
    },
    () =>
      filtrarNormas(
        unicos([
          cache.todos<Norma>('norma:'),
          ...cache.todos<Norma[]>('normas-dia:'),
          ...cache.todos<Norma[]>('busqueda-normas:'),
        ]),
        consulta,
        ramas,
      ),
  );
}

export async function obtenerNorma(id: number): Promise<Norma | null> {
  if (!supabase) return NORMAS_DEMO.find((n) => n.id === id) ?? null;
  const cliente = supabase;
  try {
    return await respaldo(`norma:${id}`, async () => {
      const { data, error } = await cliente
        .from('normas')
        .select(`${COLUMNAS_NORMA},texto`)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Norma | null;
    });
  } catch (error) {
    // Sin señal y sin la ficha guardada: al menos lo que trajo una lista (sin el texto).
    const enLista = unicos(cache.todos<Norma[]>('normas-dia:')).find((n) => n.id === id);
    if (!enLista) throw error;
    marcarCopia(new Date().toISOString());
    return enLista;
  }
}

const COLUMNAS_AFECTACION = 'efecto,parcial,referencia,clave_afectada';

/**
 * Verificación mínima de vigencia: qué normas cargadas declaran derogar o modificar
 * a esta, y qué declara ella. Sin servidor no hay datos (null), no "vigente".
 */
export async function vigenciaDe(norma: Norma): Promise<Vigencia | null> {
  if (!supabase) return null;
  const cliente = supabase;
  return respaldo(`vigencia:${norma.id}`, async () => {
    const [recibidas, emitidas] = await Promise.all([
      norma.clave
        ? cliente
            .from('afectaciones')
            .select(`${COLUMNAS_AFECTACION},norma:normas(id,numero,titulo,fecha_publicacion)`)
            .eq('clave_afectada', norma.clave)
        : Promise.resolve({ data: [], error: null }),
      cliente.from('afectaciones').select(COLUMNAS_AFECTACION).eq('norma_id', norma.id),
    ]);
    if (recibidas.error) throw recibidas.error;
    if (emitidas.error) throw emitidas.error;
    const afectadaPor = ((recibidas.data ?? []) as unknown as Afectacion[]).sort((a, b) =>
      (b.norma?.fecha_publicacion ?? '').localeCompare(a.norma?.fecha_publicacion ?? ''),
    );
    const afecta = ((emitidas.data ?? []) as unknown as Afectacion[]).map((a) => ({
      ...a,
      norma: null,
    }));
    return { afectadaPor, afecta };
  });
}

/**
 * Normas actualizadas de El Peruano (unas 150): se traen todas de una vez y se
 * filtran en el teléfono. Sin servidor la lista está vacía.
 */
export async function listarCompilados(): Promise<Compilado[]> {
  if (!supabase) return [];
  const cliente = supabase;
  return respaldo('compilados', async () => {
    const { data, error } = await cliente
      .from('compilados')
      .select('id,id_fuente,titulo,numeros,materia,url_pdf,verificado_en,cambiado_en,creado_en')
      .eq('activo', true)
      .order('titulo');
    if (error) throw error;
    return (data ?? []) as Compilado[];
  });
}

const COLUMNAS_RESOLUCION =
  'id,id_fuente,expediente,tipo,proceso,numero,colegiado,demandante,demandado,sumilla,fallo,fecha_publicacion,url_oficial,url_pdf,url_html';

/** Sin consulta ni filtros devuelve lo más reciente. */
export async function buscarJurisprudencia(
  consulta: string,
  procesos: string[],
): Promise<Resolucion[]> {
  if (!supabase) return filtrarResoluciones(RESOLUCIONES_DEMO, consulta, procesos);
  const cliente = supabase;
  return buscarConRespaldo(
    `busqueda-tc:${procesos.join(',')}`,
    consulta,
    async () => {
      const { data, error } = await cliente
        .rpc('buscar_jurisprudencia', {
          consulta,
          filtro_procesos: procesos.length ? procesos : null,
          limite: 40,
        })
        .select(COLUMNAS_RESOLUCION);
      if (error) throw error;
      return (data ?? []) as Resolucion[];
    },
    () =>
      filtrarResoluciones(
        unicos([
          cache.todos<Resolucion>('resolucion:'),
          ...cache.todos<Resolucion[]>('busqueda-tc:'),
        ]),
        consulta,
        procesos,
      ),
  );
}

export async function obtenerResolucion(id: number): Promise<Resolucion | null> {
  if (!supabase) return RESOLUCIONES_DEMO.find((r) => r.id === id) ?? null;
  const cliente = supabase;
  return respaldo(`resolucion:${id}`, async () => {
    const { data, error } = await cliente
      .from('jurisprudencia')
      .select(`${COLUMNAS_RESOLUCION},texto`)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Resolucion | null;
  });
}

// Los modelos viajan dentro de la app (src/data/modelos.json) para funcionar sin conexión;
// Supabase guarda la misma copia para otros clientes.
export function listarModelos(): Modelo[] {
  return modelosLocales;
}

export function obtenerModelo(slug: string): Modelo | null {
  return modelosLocales.find((m) => m.slug === slug) ?? null;
}

export async function listarAlertas(): Promise<Alerta[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('alertas').select('*').order('id');
  if (error) throw error;
  return (data ?? []) as Alerta[];
}

export async function guardarAlerta(alerta: Omit<Alerta, 'id'> & { id?: number }): Promise<void> {
  if (!supabase) throw new Error('Las alertas necesitan conexión con el servidor.');
  const { error } = alerta.id
    ? await supabase.from('alertas').update(alerta).eq('id', alerta.id)
    : await supabase.from('alertas').insert(alerta);
  if (error) throw error;
}

export async function borrarAlerta(id: number): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('alertas').delete().eq('id', id);
  if (error) throw error;
}

export function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
