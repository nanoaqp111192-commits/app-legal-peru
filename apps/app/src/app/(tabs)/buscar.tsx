import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AvisoDemo, Cargando, MensajeError, Vacio } from '@/components/avisos';
import { CampoBusqueda } from '@/components/campo-busqueda';
import { Chip } from '@/components/chip';
import { Pantalla } from '@/components/pantalla';
import { Rejilla } from '@/components/rejilla';
import { Segmentos } from '@/components/segmentos';
import { SelectorRamas } from '@/components/selector-ramas';
import { TarjetaCompilado } from '@/components/tarjeta-compilado';
import { TarjetaNorma } from '@/components/tarjeta-norma';
import { TarjetaPrecedente } from '@/components/tarjeta-precedente';
import { TarjetaResolucion } from '@/components/tarjeta-resolucion';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { PROCESOS_TC } from '@/data/jurisprudencia-demo';
import { useCarga } from '@/hooks/use-carga';
import { filtrarCompilados } from '@/lib/compilados';
import {
  buscarJurisprudencia,
  buscarNormas,
  buscarPrecedentes,
  listarCompilados,
} from '@/lib/datos';
import { CATEGORIAS, categoriasDe, type Categoria, type Precedente } from '@/lib/precedentes';
import type { Compilado, Norma, Resolucion } from '@/lib/tipos';

type Fuente = 'normas' | 'na' | 'tc' | 'cs' | 'ta';
const esPrecedente = (f: Fuente): f is 'cs' | 'ta' => f === 'cs' || f === 'ta';

type Resultados =
  | { fuente: 'normas'; lista: Norma[] }
  | { fuente: 'na'; lista: Compilado[] }
  | { fuente: 'tc'; lista: Resolucion[] }
  | { fuente: 'cs' | 'ta'; lista: Precedente[] }
  | null;

export default function Buscar() {
  const [fuente, setFuente] = useState<Fuente>('normas');
  const [texto, setTexto] = useState('');
  const [consulta, setConsulta] = useState('');
  const [ramas, setRamas] = useState<string[]>([]);
  const [procesos, setProcesos] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Espera a que la persona deje de escribir antes de consultar.
  useEffect(() => {
    const t = setTimeout(() => setConsulta(texto.trim()), 350);
    return () => clearTimeout(t);
  }, [texto]);

  // En jurisprudencia, sin consulta se muestran las resoluciones más recientes.
  const activa = fuente !== 'normas' || consulta.length > 0 || ramas.length > 0;
  const { datos, error, cargando } = useCarga<Resultados>(
    async () => {
      if (fuente === 'na')
        return { fuente, lista: filtrarCompilados(await listarCompilados(), consulta) };
      if (fuente === 'tc') return { fuente, lista: await buscarJurisprudencia(consulta, procesos) };
      if (esPrecedente(fuente))
        return { fuente, lista: await buscarPrecedentes(consulta, categorias, fuente) };
      return activa ? { fuente, lista: await buscarNormas(consulta, ramas) } : null;
    },
    `${fuente}|${consulta}|${ramas.join(',')}|${procesos.join(',')}|${categorias.join(',')}`,
  );

  const cambiarFuente = (f: Fuente) => {
    setFuente(f);
    setCategorias([]);
  };

  const alternar = <T,>(lista: T[], valor: T) =>
    lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

  return (
    <Pantalla>
      <ThemedText type="subtitle">Buscar</ThemedText>
      <Segmentos
        opciones={[
          { valor: 'normas', etiqueta: 'Normas' },
          { valor: 'na', etiqueta: 'Textos actualizados' },
          { valor: 'tc', etiqueta: 'Tribunal Constitucional' },
          { valor: 'cs', etiqueta: 'Corte Suprema' },
          { valor: 'ta', etiqueta: 'Tribunales administrativos' },
        ]}
        valor={fuente}
        alCambiar={cambiarFuente}
      />
      {!esPrecedente(fuente) ? <AvisoDemo /> : null}
      <CampoBusqueda
        valor={texto}
        alCambiar={setTexto}
        placeholder={
          fuente === 'na'
            ? 'Ley o tema (ej.: 29497, sociedades, CTS)'
            : fuente === 'tc'
              ? 'Expediente, parte o tema (ej.: 05853-2025, prisión preventiva)'
              : fuente === 'cs'
                ? 'Número o tema (ej.: precario, colusión, 4-2016)'
                : fuente === 'ta'
                  ? 'Número o tema (ej.: intereses moratorios, idoneidad, penalidad)'
                  : 'Número, título o tema (ej.: 32999, desalojo, CTS)'
        }
        etiqueta={
          fuente === 'normas' || fuente === 'na' ? 'Buscar normas' : 'Buscar jurisprudencia'
        }
      />
      {fuente === 'normas' ? <SelectorRamas seleccion={ramas} alCambiar={setRamas} /> : null}
      {esPrecedente(fuente) ? (
        <View style={styles.fila}>
          {categoriasDe(fuente).map((c) => (
            <Chip
              key={c}
              etiqueta={CATEGORIAS[c]}
              activo={categorias.includes(c)}
              alPresionar={() => setCategorias((l) => alternar(l, c))}
            />
          ))}
        </View>
      ) : null}
      {fuente === 'tc' ? (
        <View style={styles.fila}>
          {PROCESOS_TC.map((p) => (
            <Chip
              key={p}
              etiqueta={p}
              activo={procesos.includes(p)}
              alPresionar={() => setProcesos((l) => alternar(l, p))}
            />
          ))}
        </View>
      ) : null}
      {!activa ? (
        <Vacio>
          Escribe un término o elige una rama. La búsqueda tolera tildes y errores de tipeo.
        </Vacio>
      ) : null}
      {fuente === 'tc' && !consulta && !cargando && datos?.lista.length ? (
        <ThemedText type="small" themeColor="textSecondary">
          Resoluciones publicadas más recientemente por el Tribunal Constitucional.
        </ThemedText>
      ) : null}
      {fuente === 'na' ? (
        <ThemedText type="small" themeColor="textSecondary">
          Textos compilados por El Peruano con sus modificaciones. La app descarga cada PDF a diario
          y avisa la fecha en que detectó un cambio; no dice qué artículo cambió.
        </ThemedText>
      ) : null}
      {esPrecedente(fuente) ? (
        <ThemedText type="small" themeColor="textSecondary">
          {fuente === 'cs'
            ? 'Plenos casatorios, acuerdos plenarios y precedentes vinculantes de la Corte Suprema'
            : 'Precedentes de observancia obligatoria del Tribunal Fiscal, Indecopi, Servir, el Tribunal de Contrataciones y Sunafil'}
          , verificados uno por uno. Disponibles sin conexión.
        </ThemedText>
      ) : null}
      {activa && cargando ? <Cargando /> : null}
      {error ? <MensajeError error={error} /> : null}
      {activa && !cargando && datos?.lista.length === 0 ? <Vacio>Sin resultados.</Vacio> : null}
      {!error && datos?.lista.length ? (
        <Rejilla>
          {datos.fuente === 'normas'
            ? datos.lista.map((n) => <TarjetaNorma key={n.id} norma={n} mostrarFecha />)
            : datos.fuente === 'na'
              ? datos.lista.map((c) => <TarjetaCompilado key={c.id} compilado={c} />)
              : datos.fuente === 'tc'
                ? datos.lista.map((r) => <TarjetaResolucion key={r.id} resolucion={r} />)
                : datos.lista.map((p) => <TarjetaPrecedente key={p.id} precedente={p} />)}
        </Rejilla>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
