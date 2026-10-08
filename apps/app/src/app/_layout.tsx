import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { BotonVolver } from '@/components/boton-volver';
import { Marco } from '@/components/marco';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAbrirNotificaciones } from '@/hooks/use-abrir-notificaciones';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // En la web, el esquema se lee después de hidratar para que coincida con la página estática.
  const colorScheme = useColorScheme();
  const tema = useTheme();
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
            headerStyle: { backgroundColor: tema.background },
            headerTintColor: tema.text,
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
