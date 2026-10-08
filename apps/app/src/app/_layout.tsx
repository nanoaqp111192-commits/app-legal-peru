import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { BotonVolver } from '@/components/boton-volver';
import { Marco } from '@/components/marco';
import { useAbrirNotificaciones } from '@/hooks/use-abrir-notificaciones';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useAbrirNotificaciones();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Marco>
        <Stack
          screenOptions={{
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            ...(process.env.EXPO_OS === 'web'
              ? { headerLeft: () => <BotonVolver />, headerTitleStyle: { fontSize: 16 } }
              : {}),
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="norma/[id]" options={{ title: 'Norma' }} />
          <Stack.Screen name="resolucion/[id]" options={{ title: 'Resolución del TC' }} />
          <Stack.Screen name="precedente/[id]" options={{ title: 'Precedente' }} />
          <Stack.Screen name="modelo/[slug]" options={{ title: 'Modelo de escrito' }} />
          <Stack.Screen name="afectada/[clave]" options={{ title: 'Modificaciones' }} />
          <Stack.Screen name="compilado/[id]" options={{ title: 'Texto actualizado' }} />
        </Stack>
      </Marco>
    </ThemeProvider>
  );
}
