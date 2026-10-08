import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icono, type NombreIcono } from './icono';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variante = 'primario' | 'secundario';

type Props = {
  etiqueta: string;
  icono?: NombreIcono;
  variante?: Variante;
  /** Ocupa todo el ancho (formularios en el teléfono). */
  ancho?: boolean;
  deshabilitado?: boolean;
};

function Contenido({
  etiqueta,
  icono,
  variante = 'primario',
  hovered,
}: Props & { hovered?: boolean }) {
  const tema = useTheme();
  const primario = variante === 'primario';
  const color = primario ? tema.onAccent : tema.accent;
  return (
    <View
      style={[
        styles.boton,
        primario
          ? { backgroundColor: tema.accent, borderColor: tema.accent }
          : {
              backgroundColor: hovered ? tema.accentSuave : tema.background,
              borderColor: tema.accent,
            },
        primario && hovered && { opacity: 0.9 },
      ]}>
      {icono ? <Icono nombre={icono} color={color} tamano={18} /> : null}
      <ThemedText type="smallBold" style={{ color }}>
        {etiqueta}
      </ThemedText>
    </View>
  );
}

/** Botón de acción. Primario: la acción principal de la pantalla; secundario: el resto. */
export function Boton({
  alPresionar,
  ancho,
  deshabilitado,
  ...props
}: Props & { alPresionar: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!deshabilitado }}
      disabled={deshabilitado}
      onPress={alPresionar}
      style={({ pressed }) => [
        !ancho && styles.ajustado,
        (pressed || deshabilitado) && { opacity: 0.6 },
      ]}>
      {({ hovered }) => <Contenido {...props} hovered={hovered} />}
    </Pressable>
  );
}

/** Enlace con forma de botón; `externo` abre en otra pestaña (web) o en el navegador. */
export function BotonEnlace({
  href,
  externo,
  ancho,
  ...props
}: Props & { href: Href; externo?: boolean }) {
  return (
    <Link href={href} target={externo ? '_blank' : undefined} asChild>
      <Pressable accessibilityRole="link" style={ancho ? undefined : styles.ajustado}>
        {({ hovered }) => (
          <Contenido
            {...props}
            icono={props.icono ?? (externo ? 'externo' : undefined)}
            hovered={hovered}
          />
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  ajustado: { alignSelf: 'flex-start' },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
  },
});
