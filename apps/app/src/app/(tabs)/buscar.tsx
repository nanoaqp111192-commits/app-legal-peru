import { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { AvisoDemo, Cargando, MensajeError, Vacio } from '@/components/avisos';
import { Pantalla } from '@/components/pantalla';
import { SelectorRamas } from '@/components/selector-ramas';
import { TarjetaNorma } from '@/components/tarjeta-norma';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCarga } from '@/hooks/use-carga';
import { useTheme } from '@/hooks/use-theme';
import { buscarNormas } from '@/lib/datos';

export default function Buscar() {
  const tema = useTheme();
  const [texto, setTexto] = useState('');
  const [consulta, setConsulta] = useState('');
  const [ramas, setRamas] = useState<string[]>([]);

  // Espera a que la persona deje de escribir antes de consultar.
  useEffect(() => {
    const t = setTimeout(() => setConsulta(texto.trim()), 350);
    return () => clearTimeout(t);
  }, [texto]);

  const activa = consulta.length > 0 || ramas.length > 0;
  const { datos, error, cargando } = useCarga(
    () => (activa ? buscarNormas(consulta, ramas) : Promise.resolve(null)),
    `${consulta}|${ramas.join(',')}`,
  );

  return (
    <Pantalla>
      <ThemedText type="subtitle">Buscar normas</ThemedText>
      <AvisoDemo />
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder="Número, título o tema (ej.: 32999, desalojo, CTS)"
        placeholderTextColor={tema.textSecondary}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel="Buscar normas"
        style={[
          styles.entrada,
          { color: tema.text, borderColor: tema.border, backgroundColor: tema.backgroundElement },
        ]}
      />
      <SelectorRamas seleccion={ramas} alCambiar={setRamas} />
      {!activa ? (
        <Vacio>
          Escribe un término o elige una rama. La búsqueda tolera tildes y errores de tipeo.
        </Vacio>
      ) : null}
      {activa && cargando ? <Cargando /> : null}
      {error ? <MensajeError error={error} /> : null}
      {activa && !cargando && datos?.length === 0 ? <Vacio>Sin resultados.</Vacio> : null}
      {(activa ? (datos ?? []) : []).map((n) => (
        <TarjetaNorma key={n.id} norma={n} mostrarFecha />
      ))}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  entrada: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    fontSize: 16,
  },
});
