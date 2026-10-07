import { router } from 'expo-router';
import { useEffect } from 'react';

/** Al tocar un aviso de norma, abre su ficha (solo en la app móvil). */
export function useAbrirNotificaciones() {
  useEffect(() => {
    if (process.env.EXPO_OS === 'web') return;
    // Carga diferida: expo-notifications no tiene implementación web completa.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    const abrir = (respuesta: import('expo-notifications').NotificationResponse | null) => {
      const datos = respuesta?.notification.request.content.data as
        | { norma_id?: number; ruta?: string }
        | undefined;
      if (datos?.norma_id) {
        router.push({ pathname: '/norma/[id]', params: { id: String(datos.norma_id) } });
      } else if (datos?.ruta === '/') {
        router.push('/');
      }
    };
    abrir(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(abrir);
    return () => sub.remove();
  }, []);
}
