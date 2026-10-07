import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Vacio } from '@/components/avisos';
import { Pantalla } from '@/components/pantalla';
import { SelectorRamas } from '@/components/selector-ramas';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listarModelos } from '@/lib/datos';
import { nombreRama } from '@/lib/ramas';

const TIPO = {
  judicial: 'Escrito judicial',
  fiscal: 'Ante Fiscalía',
  extrajudicial: 'Extrajudicial',
};

export default function Modelos() {
  const tema = useTheme();
  const [ramas, setRamas] = useState<string[]>([]);
  const modelos = listarModelos().filter((m) => !ramas.length || ramas.includes(m.rama));

  return (
    <Pantalla>
      <ThemedText type="subtitle">Modelos de escritos</ThemedText>
      <ThemedText themeColor="textSecondary">
        Completa los datos y obtén el escrito listo para revisar, copiar o descargar.
      </ThemedText>
      <SelectorRamas seleccion={ramas} alCambiar={setRamas} />
      {!modelos.length ? <Vacio>Aún no hay modelos para esta rama.</Vacio> : null}
      {modelos.map((m) => (
        <Link key={m.slug} href={{ pathname: '/modelo/[slug]', params: { slug: m.slug } }} asChild>
          <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }}>
            <ThemedView
              type="backgroundElement"
              style={[styles.tarjeta, { borderColor: tema.border }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {nombreRama(m.rama)} · {TIPO[m.tipo]}
                {m.estado === 'borrador' ? ' · Borrador en revisión' : ''}
              </ThemedText>
              <ThemedText type="smallBold">{m.titulo}</ThemedText>
              <ThemedText type="small">{m.descripcion}</ThemedText>
            </ThemedView>
          </Pressable>
        </Link>
      ))}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.one,
  },
});
