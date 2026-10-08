// Props que react-native-web acepta en la web y los tipos de React Native no declaran.
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    /** Se convierte en atributos data-* (los usa global.css). */
    dataSet?: Record<string, string>;
  }
  interface PressableStateCallbackType {
    /** Puntero encima (solo web). */
    hovered?: boolean;
  }
}
