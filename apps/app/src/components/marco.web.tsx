import { Link, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ExternalLink } from './external-link';
import { Icono } from './icono';
import { ThemedText } from './themed-text';

import { AnchoBarraLateral, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SECCIONES, seccionDe } from '@/lib/secciones';

/**
 * Web: menú lateral fijo en pantallas anchas. Se muestra u oculta con CSS
 * (global.css, atributo data-marco) para que la página estática ya llegue con el
 * diseño correcto, sin saltos al cargar.
 */
export function Marco({ children }: { children: ReactNode }) {
  const tema = useTheme();
  return (
    <View style={styles.fila}>
      <View
        dataSet={{ marco: 'lateral' }}
        style={[
          styles.lateral,
          { backgroundColor: tema.backgroundElement, borderColor: tema.border },
        ]}>
        <BarraLateral />
      </View>
      <View style={styles.contenido}>{children}</View>
    </View>
  );
}

function BarraLateral() {
  const tema = useTheme();
  const activa = seccionDe(usePathname());
  return (
    <View style={styles.barra}>
      <Link href="/" asChild>
        <Pressable accessibilityRole="link">
          <View style={styles.marca}>
            <View style={[styles.logo, { backgroundColor: tema.accent }]}>
              <Icono nombre="balanza" color={tema.onAccent} tamano={20} />
            </View>
            <View>
              <ThemedText type="smallBold" style={{ color: tema.accent, fontSize: 16 }}>
                App Legal Perú
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                Normas y jurisprudencia
              </ThemedText>
            </View>
          </View>
        </Pressable>
      </Link>

      <View style={styles.menu} accessibilityRole="menu">
        {SECCIONES.map((s) => {
          const seleccionada = activa === s.nombre;
          return (
            <Link key={s.nombre} href={s.href} asChild>
              <Pressable accessibilityRole="link" accessibilityState={{ selected: seleccionada }}>
                {({ hovered }) => (
                  <View
                    style={[
                      styles.opcion,
                      seleccionada && { backgroundColor: tema.accentSuave },
                      !seleccionada && hovered && { backgroundColor: tema.backgroundSelected },
                    ]}>
                    <Icono
                      nombre={s.icono}
                      color={seleccionada ? tema.accent : tema.textSecondary}
                      tamano={22}
                    />
                    <View style={styles.textos}>
                      <ThemedText
                        type="smallBold"
                        style={{ color: seleccionada ? tema.accent : tema.text, fontSize: 15 }}>
                        {s.etiqueta}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                        {s.descripcion}
                      </ThemedText>
                    </View>
                  </View>
                )}
              </Pressable>
            </Link>
          );
        })}
      </View>

      <View style={[styles.pie, { borderColor: tema.border }]}>
        <ExternalLink href="https://diariooficial.elperuano.pe/Normas" asChild>
          <Pressable>
            {({ hovered }) => (
              <View
                style={[styles.opcion, hovered && { backgroundColor: tema.backgroundSelected }]}>
                <Icono nombre="externo" color={tema.textSecondary} tamano={18} />
                <ThemedText type="small" themeColor="textSecondary">
                  Diario oficial El Peruano
                </ThemedText>
              </View>
            )}
          </Pressable>
        </ExternalLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flex: 1, flexDirection: 'row' },
  lateral: { width: AnchoBarraLateral, borderRightWidth: 1 },
  contenido: { flex: 1, minWidth: 0 },
  barra: { flex: 1, padding: Spacing.three, gap: Spacing.four },
  marca: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: { gap: Spacing.one },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  textos: { flexShrink: 1 },
  pie: { marginTop: 'auto', borderTopWidth: 1, paddingTop: Spacing.three },
});
