import { NORMAS_DEMO } from '@/data/normas-demo';
import MODELOS from '@/data/modelos.json';

import { supabase } from './supabase';
import type { Alerta, Modelo, Norma } from './tipos';

const COLUMNAS_NORMA =
  'id,id_fuente,tipo,numero,titulo,sumilla,sector,fecha_publicacion,edicion_extraordinaria,url_oficial,url_pdf,ramas,verificado_en';

const modelosLocales = MODELOS as Modelo[];

export async function normasDeFecha(fecha: string): Promise<Norma[]> {
  if (!supabase) return NORMAS_DEMO.filter((n) => n.fecha_publicacion === fecha);
  const { data, error } = await supabase
    .from('normas')
    .select(COLUMNAS_NORMA)
    .eq('fecha_publicacion', fecha)
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Norma[];
}

/** La fecha más reciente con normas, para no mostrar un día vacío temprano en la mañana. */
export async function ultimaFechaConNormas(): Promise<string | null> {
  if (!supabase) return NORMAS_DEMO[0]?.fecha_publicacion ?? null;
  const { data, error } = await supabase
    .from('normas')
    .select('fecha_publicacion')
    .order('fecha_publicacion', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0]?.fecha_publicacion ?? null;
}

export async function buscarNormas(consulta: string, ramas: string[]): Promise<Norma[]> {
  if (!supabase) {
    const q = sinTildes(consulta);
    return NORMAS_DEMO.filter(
      (n) =>
        (!ramas.length || n.ramas.some((r) => ramas.includes(r))) &&
        (!q || sinTildes(`${n.numero} ${n.titulo} ${n.sector}`).includes(q)),
    );
  }
  const { data, error } = await supabase
    .rpc('buscar_normas', { consulta, filtro_ramas: ramas.length ? ramas : null, limite: 40 })
    .select(COLUMNAS_NORMA);
  if (error) throw error;
  return (data ?? []) as Norma[];
}

export async function obtenerNorma(id: number): Promise<Norma | null> {
  if (!supabase) return NORMAS_DEMO.find((n) => n.id === id) ?? null;
  const { data, error } = await supabase
    .from('normas')
    .select(`${COLUMNAS_NORMA},texto`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Norma | null;
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
