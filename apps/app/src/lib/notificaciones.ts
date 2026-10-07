import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

/**
 * Pide permiso y registra el token de Expo Push del dispositivo en Supabase.
 * Requiere una build de desarrollo o de tienda (no Expo Go) y el projectId de EAS.
 */
export async function activarAvisos(): Promise<string> {
  if (Platform.OS === 'web') throw new Error('Los avisos push están disponibles en la app móvil.');
  if (!Device.isDevice) throw new Error('Los avisos push necesitan un teléfono real.');
  if (!supabase) throw new Error('Los avisos necesitan conexión con el servidor.');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('normas', {
      name: 'Normas nuevas',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: actual } = await Notifications.getPermissionsAsync();
  const { status } =
    actual === 'granted' ? { status: actual } : await Notifications.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('No se concedió el permiso de notificaciones.');

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('Falta configurar el proyecto de EAS (projectId).');

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await supabase
    .from('dispositivos')
    .upsert({ expo_push_token: token, plataforma: Platform.OS }, { onConflict: 'expo_push_token' });
  if (error) throw error;
  return token;
}
