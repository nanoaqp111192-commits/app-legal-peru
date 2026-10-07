import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AvisoDemo, Cargando, MensajeError, Vacio } from '@/components/avisos';
import { Chip } from '@/components/chip';
import { Pantalla } from '@/components/pantalla';
import { SelectorRamas } from '@/components/selector-ramas';
import { TarjetaNorma } from '@/components/tarjeta-norma';
import { TarjetaResolucion } from '@/components/tarjeta-resolucion';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { PROCESOS_TC } from '@/data/jurisprudencia-demo';
import { useCarga } from '@/hooks/use-carga';
import { useTheme } from '@/hooks/use-theme';
import { buscarJurisprudencia, buscarNormas } from '@/lib/datos';
import type { Norma, Resolucion } from '@/lib/tipos';

type Fuente = 'normas' | 'tc';

type Resultados =
  | { fuente: 'normas'; lista: Norma[] }
  | { fuente: 'tc'; lista: Resolucion[] }
  | null;

export default function Buscar() {
  const tema = useTheme();
  const [fuente, setFuente] = useState<Fuente>('normas');
  const [texto, setTexto] = useState('');
  const [consulta, setConsulta] = useState('');
  const [ramas, setRamas] = useState<string[]>([]);
  const [procesos, setProcesos] = useState<string[]>([]);

  // Espera a que la persona deje de escribir antes de consultar.
  useEffect(() => {
    const t = setTimeout(() => setConsulta(texto.trim()), 350);
    return () => clearTimeout(t);
  }, [texto]);

  // En jurisprudencia, sin consulta se muestran las resoluciones más recientes.
  const activa = fuente === 'tc' || consulta.length > 0 || ramas.length > 0;
  const { datos, error, cargando } = useCarga<Resultados>(
    async () => {
      if (fuente === 'tc') return { fuente, lista: await buscarJurisprudencia(consulta, procesos) };
      return activa ? { fuente, lista: await buscarNormas(consulta, ramas) } : null;
    },
    `${fuente}|${consulta}|${ramas.join(',')}|${procesos.join(',')}`,
  );

  const alternar = (lista: string[], valor: string) =>
    lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

  return (
    <Pantalla>
      <ThemedText type="subtitle">Buscar</ThemedText>
      <View style={styles.fila}>
        <Chip
          etiqueta="Normas"
          activo={fuente === 'normas'}
          alPresionar={() => setFuente('normas')}
        />
        <Chip
          etiqueta="Jurisprudencia del TC"
          activo={fuente === 'tc'}
          alPresionar={() => setFuente('tc')}
        />
      </View>
      <AvisoDemo />
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder={
          fuente === 'tc'
            ? 'Expediente, parte o tema (ej.: 05853-2025, prisión preventiva)'
            : 'Número, título o tema (ej.: 32999, desalojo, CTS)'
        }
        placeholderTextColor={tema.textSecondary}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={fuente === 'tc' ? 'Buscar jurisprudencia' : 'Buscar normas'}
        style={[
          styles.entrada,
          { color: tema.text, borderColor: tema.border, backgroundColor: tema.backgroundElement },
        ]}
      />
      {fuente === 'normas' ? (
        <SelectorRamas seleccion={ramas} alCambiar={setRamas} />
      ) : (
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
      )}
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
      {activa && cargando ? <Cargando /> : null}
      {error ? <MensajeError error={error} /> : null}
      {activa && !cargando && datos?.lista.length === 0 ? <Vacio>Sin resultados.</Vacio> : null}
      {datos?.fuente === 'normas'
        ? datos.lista.map((n) => <TarjetaNorma key={n.id} norma={n} mostrarFecha />)
        : null}
      {datos?.fuente === 'tc'
        ? datos.lista.map((r) => <TarjetaResolucion key={r.id} resolucion={r} />)
        : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  entrada: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    fontSize: 16,
  },
});
