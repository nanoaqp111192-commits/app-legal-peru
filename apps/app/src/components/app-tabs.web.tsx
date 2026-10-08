import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icono, type NombreIcono } from './icono';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SECCIONES } from '@/lib/secciones';

/**
 * Web: en pantallas angostas, barra de pestañas fija abajo (como en el teléfono).
 * En escritorio la oculta global.css y se navega con el menú lateral (Marco).
 */
export default function AppTabs() {
  const tema = useTheme();
  return (
    <Tabs style={styles.raiz}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <View
          dataSet={{ marco: 'pestanas' }}
          style={[styles.barra, { backgroundColor: tema.background, borderColor: tema.border }]}>
          {SECCIONES.map((s) => (
            <TabTrigger key={s.nombre} name={s.nombre} href={s.href} asChild>
              <Pestana icono={s.icono}>{s.etiqueta}</Pestana>
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

function Pestana({
  children,
  isFocused,
  icono,
  ...props
}: TabTriggerSlotProps & { icono: NombreIcono }) {
  const tema = useTheme();
  const color = isFocused ? tema.accent : tema.textSecondary;
  return (
    <Pressable {...props} style={styles.pestana}>
      <View style={[styles.pildora, isFocused && { backgroundColor: tema.accentSuave }]}>
        <Icono nombre={icono} color={color} tamano={22} />
      </View>
      <ThemedText type="small" style={{ color, fontSize: 12, lineHeight: 16 }}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  slot: { flex: 1 },
  barra: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
  },
  pestana: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: Spacing.one },
  pildora: { paddingHorizontal: Spacing.three, paddingVertical: 2, borderRadius: 999 },
});
