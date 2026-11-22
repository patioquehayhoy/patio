import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Pantallas que pueden abrirse como hoja encima de otra (la reseña y el acceso,
// desde la ficha). Su propio SafeAreaProvider mide el área segura de la hoja y
// no la de toda la pantalla: dentro de una hoja arriba no hay barra de estado
// que librar, así que no se suma ese alto (react-native-safe-area-context lo
// indica para modales nativos). A pantalla completa mide lo mismo de siempre.
export function SheetSafeArea({ children }: { children: ReactNode }) {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
