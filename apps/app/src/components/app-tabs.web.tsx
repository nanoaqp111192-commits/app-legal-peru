import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';

import { ExternalLink } from './external-link';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

const sinSuscripcion = () => () => {};

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Hoy</TabButton>
          </TabTrigger>
          <TabTrigger name="buscar" href="/buscar" asChild>
            <TabButton>Buscar</TabButton>
          </TabTrigger>
          <TabTrigger name="modelos" href="/modelos" asChild>
            <TabButton>Modelos</TabButton>
          </TabTrigger>
          <TabTrigger name="plazos" href="/plazos" asChild>
            <TabButton>Plazos</TabButton>
          </TabTrigger>
          <TabTrigger name="alertas" href="/alertas" asChild>
            <TabButton>Alertas</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  // En pantallas angostas solo caben las pestañas. La página estática se genera en modo
  // angosto (móvil primero) y el navegador ajusta después de hidratar.
  const ancho = useWindowDimensions().width;
  const enCliente = useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
  const angosta = !enCliente || ancho < 640;

  return (
    <View {...props} style={[styles.tabListContainer, angosta && styles.compacto]}>
      <ThemedView
        type="backgroundElement"
        style={[styles.innerContainer, angosta && styles.compacto]}>
        {angosta ? null : (
          <ThemedText type="smallBold" style={[styles.brandText, { color: colors.accent }]}>
            App Legal Perú
          </ThemedText>
        )}

        {props.children}

        {angosta ? null : (
          <ExternalLink href="https://diariooficial.elperuano.pe/Normas" asChild>
            <Pressable style={styles.externalPressable}>
              <ThemedText type="link">El Peruano</ThemedText>
              <SymbolView
                tintColor={colors.text}
                name={{ ios: 'arrow.up.right.square', web: 'link' }}
                size={12}
              />
            </Pressable>
          </ExternalLink>
        )}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  // Cinco pestañas en 360-390 px: menos relleno para que no desborden.
  compacto: {
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
});
