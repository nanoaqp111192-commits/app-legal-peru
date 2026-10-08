/**
 * Colores de la app en modo claro y oscuro. `accent` es el color de marca
 * (vino tinto); `verificar` resalta las marcas [[VERIFICAR]] de los modelos.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    accent: '#8C1D2F',
    accentSuave: '#F6E8EA',
    onAccent: '#ffffff',
    border: '#D9D9E0',
    verificar: '#FFF3B0',
    vacio: '#B42318',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    accent: '#E8838F',
    accentSuave: '#3A1A20',
    onAccent: '#1A0006',
    border: '#3A3D42',
    verificar: '#5C4B00',
    vacio: '#FF8A80',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
/** Ancho máximo en escritorio: listas y paneles, y columna de lectura de textos largos. */
export const AnchoAmplio = 1120;
export const AnchoLectura = 760;
/** Desde este ancho (px) la web usa el menú lateral y columnas. */
export const AnchoEscritorio = 1024;
export const AnchoBarraLateral = 264;
