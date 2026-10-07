import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

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
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="norma/[id]" options={{ title: 'Norma' }} />
        <Stack.Screen name="resolucion/[id]" options={{ title: 'Resolución del TC' }} />
        <Stack.Screen name="modelo/[slug]" options={{ title: 'Modelo de escrito' }} />
      </Stack>
    </ThemeProvider>
  );
}
