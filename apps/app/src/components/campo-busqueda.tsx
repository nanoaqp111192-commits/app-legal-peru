import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icono } from './icono';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Caja de búsqueda con lupa y botón para borrar lo escrito. */
export function CampoBusqueda({
  valor,
  alCambiar,
  placeholder,
  etiqueta,
}: {
  valor: string;
  alCambiar: (texto: string) => void;
  placeholder: string;
  etiqueta: string;
}) {
  const tema = useTheme();
  const [foco, setFoco] = useState(false);
  return (
    <View
      style={[
        styles.caja,
        { borderColor: foco ? tema.accent : tema.border, backgroundColor: tema.background },
      ]}>
      <Icono nombre="buscar" color={tema.textSecondary} />
      <TextInput
        value={valor}
        onChangeText={alCambiar}
        placeholder={placeholder}
        placeholderTextColor={tema.textSecondary}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={etiqueta}
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        style={[styles.entrada, { color: tema.text }]}
      />
      {valor ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar búsqueda"
          onPress={() => alCambiar('')}
          hitSlop={8}>
          <Icono nombre="cerrar" color={tema.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1.5,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  // Sin contorno propio: el borde de la caja cambia de color al escribir.
  entrada: { flex: 1, paddingVertical: Spacing.three, fontSize: 16, outlineWidth: 0 },
});
